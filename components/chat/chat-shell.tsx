"use client"

import { ConversationList } from "@/components/chat/conversation-list"
import { ConversationView } from "@/components/chat/conversation-view"
import { NavRail } from "@/components/chat/nav-rail"
import { NewChatDialog } from "@/components/chat/new-chat-dialog"
import { createClient } from "@/lib/supabase/client"
import type { ConversationListItem, Profile } from "@/lib/types"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquarePlus } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { GobakLogo } from "@/components/gobak-logo"

type Props = {
  profile: Profile
}

export function ChatShell({ profile }: Props) {
  const [items, setItems] = useState<ConversationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [starting, setStarting] = useState(false)

  const selected = items.find((i) => i.conversation.id === selectedId) ?? null

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Sohbetler yüklenemedi")
      setItems(json.conversations ?? [])
      return json.conversations as ConversationListItem[]
    } catch (err: any) {
      setError(err.message)
      return []
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  // Global realtime: herhangi bir yeni mesaj veya sohbet geldiğinde listeyi tazele
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`user-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          refresh()
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_members" },
        (payload: any) => {
          if (payload.new?.user_id === profile.id) {
            refresh()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile.id, refresh])

  const handleStart = async (username: string) => {
    if (starting) return
    setStarting(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Sohbet başlatılamadı")
      await refresh()
      setSelectedId(json.conversation_id)
      setNewOpen(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <NavRail profile={profile} />

      {/* Mobil: sadece liste ya da sohbet görünür */}
      <div
        className={`h-full w-full flex-col md:flex md:w-auto ${
          selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        <ConversationList
          items={items}
          currentUserId={profile.id}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewChat={() => setNewOpen(true)}
          loading={loading}
        />
      </div>

      <div
        className={`h-full min-w-0 flex-1 flex-col md:flex ${
          selectedId ? "flex" : "hidden md:flex"
        }`}
      >
        {selected ? (
          <ConversationView
            item={selected}
            currentUser={profile}
            onBack={() => setSelectedId(null)}
            onMessagesChanged={refresh}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gbk-grid-bg px-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GobakLogo className="size-10" />
                </EmptyMedia>
                <EmptyTitle>GobakChat&apos;e hoş geldin, {profile.display_name}</EmptyTitle>
                <EmptyDescription>
                  Soldaki listeden bir sohbet seç ya da yeni bir sohbet başlat.
                  Tüm mesajların gerçek zamanlı olarak iletilir.
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={() => setNewOpen(true)} className="gap-1.5">
                <MessageSquarePlus className="size-4" />
                Yeni sohbet başlat
              </Button>
            </Empty>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <NewChatDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onSelect={handleStart}
      />
    </div>
  )
}
