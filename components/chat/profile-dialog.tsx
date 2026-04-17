"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Profile } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { UserAvatar } from "@/components/chat/user-avatar"
import { Camera } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
}

export function ProfileDialog({ open, onOpenChange, profile }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [bio, setBio] = useState(profile.bio ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleAvatar = async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Yükleme başarısız")
      setAvatarUrl(json.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Kaydedilemedi")
      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profilim</DialogTitle>
          <DialogDescription>
            Görünen adın ve biyografini düzenle. Kullanıcı adın: @
            {profile.username}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            <UserAvatar
              name={displayName || profile.display_name}
              seed={profile.username}
              src={avatarUrl}
              className="size-24"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110"
              aria-label="Profil fotoğrafı değiştir"
            >
              {uploading ? (
                <Spinner className="size-4" />
              ) : (
                <Camera className="size-4" />
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAvatar(file)
                e.target.value = ""
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-display">Görünen ad</Label>
            <Input
              id="p-display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-bio">Biyografi</Label>
            <Textarea
              id="p-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              placeholder="Kendinden kısaca bahset..."
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">
              {bio.length}/160
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? (
              <>
                <Spinner className="size-4" />
                Kaydediliyor…
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
