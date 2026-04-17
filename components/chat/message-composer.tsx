"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Paperclip, SendHorizontal, X } from "lucide-react"
import { useRef, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type Props = {
  onSend: (args: {
    content?: string
    media_url?: string
    media_type?: "image" | "video" | "audio" | "file"
  }) => Promise<void>
  disabled?: boolean
}

type Attachment = {
  url: string
  media_type: "image" | "video" | "audio" | "file"
  name: string
}

export function MessageComposer({ onSend, disabled }: Props) {
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const doSend = async () => {
    const content = text.trim()
    if (!content && !attachment) return
    setSending(true)
    setError(null)
    try {
      await onSend({
        content: content || undefined,
        media_url: attachment?.url,
        media_type: attachment?.media_type,
      })
      setText("")
      setAttachment(null)
      textareaRef.current?.focus()
    } catch (err: any) {
      setError(err.message || "Gönderilemedi")
    } finally {
      setSending(false)
    }
  }

  const handleFile = async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Yükleme başarısız")
      setAttachment({
        url: json.url,
        media_type: json.media_type,
        name: file.name,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border-t border-border/60 bg-card/50 p-3 sm:p-4">
      {error && (
        <p
          role="alert"
          className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive"
        >
          {error}
        </p>
      )}

      {attachment && (
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2">
          {attachment.media_type === "image" ? (
            <img
              src={attachment.url || "/placeholder.svg"}
              alt="Ek"
              className="size-14 rounded-md object-cover"
            />
          ) : (
            <div className="grid size-14 place-items-center rounded-md bg-muted text-muted-foreground">
              <Paperclip className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{attachment.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {attachment.media_type === "image"
                ? "Fotoğraf"
                : attachment.media_type === "video"
                  ? "Video"
                  : attachment.media_type === "audio"
                    ? "Ses"
                    : "Dosya"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAttachment(null)}
            aria-label="Eki kaldır"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => imageInput.current?.click()}
            disabled={uploading || disabled}
            aria-label="Fotoğraf/video ekle"
            className="size-10 rounded-full"
          >
            {uploading ? (
              <Spinner className="size-4" />
            ) : (
              <ImagePlus className="size-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInput.current?.click()}
            disabled={uploading || disabled}
            aria-label="Dosya ekle"
            className="size-10 rounded-full"
          >
            <Paperclip className="size-5" />
          </Button>
          <input
            ref={imageInput}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ""
            }}
          />
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ""
            }}
          />
        </div>

        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              doSend()
            }
          }}
          placeholder="Mesaj yaz..."
          rows={1}
          disabled={disabled}
          className={cn(
            "max-h-40 min-h-10 flex-1 resize-none rounded-2xl bg-muted/60 px-4 py-2.5 text-sm",
          )}
        />

        <Button
          onClick={doSend}
          disabled={sending || disabled || (!text.trim() && !attachment)}
          size="icon"
          className="size-10 shrink-0 rounded-full"
          aria-label="Gönder"
        >
          {sending ? (
            <Spinner className="size-4" />
          ) : (
            <SendHorizontal className="size-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
