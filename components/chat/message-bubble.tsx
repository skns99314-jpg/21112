"use client"

import { formatTime } from "@/lib/gobak-utils"
import type { Message, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { FileIcon } from "lucide-react"
import { UserAvatar } from "@/components/chat/user-avatar"

type Props = {
  message: Message
  sender: Profile | null
  isMine: boolean
  showAvatar: boolean
  isGroup: boolean
}

export function MessageBubble({
  message,
  sender,
  isMine,
  showAvatar,
  isGroup,
}: Props) {
  return (
    <div
      className={cn(
        "flex w-full items-end gap-2",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {!isMine && (
        <div className="w-8 shrink-0">
          {showAvatar && sender ? (
            <UserAvatar
              name={sender.display_name}
              seed={sender.username}
              src={sender.avatar_url}
              className="size-8"
            />
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-1",
          isMine ? "items-end" : "items-start",
        )}
      >
        {!isMine && showAvatar && isGroup && sender && (
          <span className="px-1 text-xs font-medium text-primary">
            {sender.display_name}
          </span>
        )}

        <div
          className={cn(
            "relative px-3.5 py-2 text-sm leading-relaxed shadow-sm",
            isMine
              ? "gbk-bubble-me bg-primary text-primary-foreground"
              : "gbk-bubble-them bg-card text-card-foreground",
          )}
        >
          {message.media_url && message.media_type === "image" && (
            <a
              href={message.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-1 block overflow-hidden rounded-md"
            >
              <img
                src={message.media_url || "/placeholder.svg"}
                alt="Gönderilen fotoğraf"
                className="max-h-72 w-auto max-w-full object-cover"
                loading="lazy"
              />
            </a>
          )}
          {message.media_url && message.media_type === "video" && (
            <video
              controls
              src={message.media_url}
              className="mb-1 max-h-72 w-auto max-w-full rounded-md bg-black"
            />
          )}
          {message.media_url && message.media_type === "audio" && (
            <audio controls src={message.media_url} className="mb-1 w-full" />
          )}
          {message.media_url && message.media_type === "file" && (
            <a
              href={message.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mb-1 flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs",
                isMine
                  ? "border-primary-foreground/30 bg-primary-foreground/10"
                  : "border-border bg-muted",
              )}
            >
              <FileIcon className="size-4" />
              Dosyayı aç
            </a>
          )}

          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          <div
            className={cn(
              "mt-0.5 flex items-center gap-1 text-[10px]",
              isMine
                ? "text-primary-foreground/70"
                : "text-muted-foreground",
            )}
          >
            <span>{formatTime(message.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
