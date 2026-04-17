"use client"

import { MessageBubble } from "@/components/chat/message-bubble"
import { MessageComposer } from "@/components/chat/message-composer"
import { UserAvatar } from "@/components/chat/user-avatar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { conversationDisplayName } from "@/lib/gobak-utils"
import type { ConversationListItem, Message, Profile } from "@/lib/types"
import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { MessageSquare } from "lucide-react"

type Props = {
  item: ConversationListItem
  currentUser: Profile
  onBack?: () => void
  onMessagesChanged?: () => void
}

function groupByDay(messages: Message[]) {
  const groups: { label: string; items: Message[] }[] = []
  for (const m of messages) {
    const d = new Date(m.created_at)
    const label = d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(m)
    else groups.push({ label, items: [m] })
  }
  return groups
}

export function ConversationView({
  item,
  currentUser,
  onBack,
  onMessagesChanged,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const convId = item.conversation.id

  const memberMap = useMemo(() => {
    const map = new Map<string, Profile>()
    for (const m of item.members) map.set(m.id, m)
    map.set(currentUser.id, currentUser)
    return map
  }, [item.members, currentUser])

  const name = conversationDisplayName(item)
  const subtitle = item.conversation.is_group
    ? `${item.members.length} üye`
    : item.other
      ? `@${item.other.username}`
      : ""

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    })
  }, [])

  const markRead = useCallback(
    async (lastId: string | null) => {
      try {
        await fetch(`/api/conversations/${convId}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ last_read_message_id: lastId }),
        })
      } catch {
        // sessiz
      }
    },
    [convId],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/conversations/${convId}/messages`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Mesajlar yüklenemedi")
        if (cancelled) return
        setMessages(json.messages ?? [])
        requestAnimationFrame(() => scrollToBottom(false))
        const last = json.messages?.[json.messages.length - 1]
        if (last) await markRead(last.id)
        onMessagesChanged?.()
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [convId, markRead, onMessagesChanged, scrollToBottom])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`conv-${convId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          requestAnimationFrame(() => scrollToBottom(true))
          if (newMsg.sender_id !== currentUser.id) {
            markRead(newMsg.id)
          }
          onMessagesChanged?.()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [convId, currentUser.id, markRead, onMessagesChanged, scrollToBottom])

  const handleSend = async (args: {
    content?: string
    media_url?: string
    media_type?: "image" | "video" | "audio" | "file"
  }) => {
    const res = await fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Gönderilemedi")
    // Realtime de ekleyecek ama duplicate'i önlüyoruz — yine de hemen lokal ekleyelim:
    setMessages((prev) => {
      if (prev.some((m) => m.id === json.message.id)) return prev
      return [...prev, json.message]
    })
    requestAnimationFrame(() => scrollToBottom(true))
    onMessagesChanged?.()
  }

  const dayGroups = useMemo(() => groupByDay(messages), [messages])

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border/60 bg-card/40 px-4 py-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBack}
            aria-label="Geri"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <UserAvatar
          name={name}
          seed={item.other?.username ?? convId}
          src={item.other?.avatar_url ?? null}
          className="size-10"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </header>

      {/* Mesaj listesi */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto gbk-scroll gbk-grid-bg px-3 py-4 sm:px-6"
      >
        {error && (
          <p
            role="alert"
            className="mx-auto mb-3 max-w-sm rounded-md border border-destructive/40 bg-destructive/10 p-2 text-center text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`h-8 w-40 animate-pulse rounded-2xl ${
                    i % 2 ? "bg-primary/20" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle>İlk mesajı sen yaz</EmptyTitle>
              <EmptyDescription>
                {name} ile henüz mesajlaşmadınız. Bir "selam" yeter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {dayGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <div className="sticky top-0 z-10 mx-auto my-2 rounded-full bg-muted/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                  {group.label}
                </div>
                {group.items.map((m, idx) => {
                  const prev = group.items[idx - 1]
                  const sameSender = prev && prev.sender_id === m.sender_id
                  const showAvatar = !sameSender
                  const sender = memberMap.get(m.sender_id) ?? null
                  const isMine = m.sender_id === currentUser.id
                  return (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      sender={sender}
                      isMine={isMine}
                      showAvatar={showAvatar}
                      isGroup={item.conversation.is_group}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <MessageComposer onSend={handleSend} />
    </section>
  )
}
