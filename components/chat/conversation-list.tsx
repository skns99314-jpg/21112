"use client"

import { UserAvatar } from "@/components/chat/user-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { conversationDisplayName, formatTime } from "@/lib/gobak-utils"
import type { ConversationListItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { MessageSquarePlus, Search } from "lucide-react"
import { useMemo, useState } from "react"

type Props = {
  items: ConversationListItem[]
  currentUserId: string
  selectedId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  loading?: boolean
}

export function ConversationList({
  items,
  currentUserId,
  selectedId,
  onSelect,
  onNewChat,
  loading,
}: Props) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => {
      const name = conversationDisplayName(it).toLowerCase()
      const username = it.other?.username?.toLowerCase() ?? ""
      const last = it.last_message?.content?.toLowerCase() ?? ""
      return name.includes(q) || username.includes(q) || last.includes(q)
    })
  }, [items, query])

  return (
    <aside className="flex h-full w-full flex-col border-r border-border/60 bg-sidebar md:w-80 lg:w-96">
      <div className="flex items-center justify-between gap-2 p-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Sohbetler
        </h2>
        <Button
          size="sm"
          onClick={onNewChat}
          className="gap-1.5"
          aria-label="Yeni sohbet"
        >
          <MessageSquarePlus className="size-4" />
          Yeni
        </Button>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Sohbetlerde ara..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto gbk-scroll">
        {loading ? (
          <ul className="flex flex-col gap-1 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-xl p-3"
              >
                <div className="size-11 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted/70" />
                </div>
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquarePlus />
              </EmptyMedia>
              <EmptyTitle>
                {items.length === 0
                  ? "Henüz sohbet yok"
                  : "Sonuç bulunamadı"}
              </EmptyTitle>
              <EmptyDescription>
                {items.length === 0
                  ? "Yeni sohbet başlat butonuyla bir kullanıcı adına mesaj gönder."
                  : "Farklı bir kelime dene."}
              </EmptyDescription>
            </EmptyHeader>
            {items.length === 0 && (
              <Button onClick={onNewChat} className="mt-2 gap-1.5">
                <MessageSquarePlus className="size-4" />
                Yeni sohbet başlat
              </Button>
            )}
          </Empty>
        ) : (
          <ul className="flex flex-col gap-0.5 px-2 pb-2">
            {filtered.map((item) => {
              const name = conversationDisplayName(item)
              const isSelected = selectedId === item.conversation.id
              const last = item.last_message
              const lastText = last
                ? last.content ??
                  (last.media_type === "image"
                    ? "Fotoğraf"
                    : last.media_type === "video"
                      ? "Video"
                      : last.media_type === "audio"
                        ? "Sesli mesaj"
                        : last.media_type === "file"
                          ? "Dosya"
                          : "")
                : "Henüz mesaj yok"
              const lastIsMine = last?.sender_id === currentUserId

              return (
                <li key={item.conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.conversation.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-3 text-left transition",
                      isSelected
                        ? "bg-primary/15 text-foreground"
                        : "hover:bg-accent/60",
                    )}
                  >
                    <UserAvatar
                      name={name}
                      seed={item.other?.username ?? item.conversation.id}
                      src={item.other?.avatar_url ?? null}
                      className="size-11"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">
                          {name}
                        </p>
                        {last && (
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                            {formatTime(last.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm text-muted-foreground">
                          {lastIsMine ? "Sen: " : ""}
                          {lastText}
                        </p>
                        {item.unread_count > 0 && (
                          <span
                            className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
                            aria-label={`${item.unread_count} okunmamış mesaj`}
                          >
                            {item.unread_count > 99 ? "99+" : item.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
