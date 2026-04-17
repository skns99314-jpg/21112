"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Profile } from "@/lib/types"
import { useEffect, useRef, useState } from "react"
import { UserAvatar } from "@/components/chat/user-avatar"
import { Loader2, Search } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (username: string) => void | Promise<void>
}

export function NewChatDialog({ open, onOpenChange, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`,
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Arama başarısız")
        setResults(json.results ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni sohbet başlat</DialogTitle>
          <DialogDescription>
            Kullanıcı adı veya görünen adla ara.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            autoFocus
            placeholder="@kullanıcı_adı veya isim"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="max-h-72 overflow-y-auto gbk-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : query.trim().length < 2 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              En az 2 harf yaz.
            </p>
          ) : results.length === 0 ? (
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyTitle>Kullanıcı bulunamadı</EmptyTitle>
                <EmptyDescription>
                  Farklı bir kullanıcı adı deneyebilirsin.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(p.username)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-accent"
                  >
                    <UserAvatar
                      name={p.display_name}
                      seed={p.username}
                      src={p.avatar_url}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {p.display_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{p.username}
                        {p.bio ? ` · ${p.bio}` : ""}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Mesaj gönder
                    </Button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
