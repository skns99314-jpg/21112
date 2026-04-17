"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { validateUsername } from "@/lib/gobak-utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { AtSign } from "lucide-react"

export default function SignUpPage() {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const normalizedUsername = username.trim().toLowerCase()
    const usernameErr = validateUsername(normalizedUsername)
    if (usernameErr) {
      setError(usernameErr)
      return
    }
    if (!displayName.trim()) {
      setError("Görünen ad gerekli.")
      return
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.")
      return
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.")
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      // 1) Kullanıcı adı müsait mi?
      const { data: existing, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", normalizedUsername)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116: no rows — sadece "bulunamadı" demek
        throw checkError
      }
      if (existing) {
        throw new Error("Bu kullanıcı adı alınmış, başka bir tane dene.")
      }

      // 2) Auth kaydı oluştur
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            username: normalizedUsername,
            display_name: displayName.trim(),
          },
        },
      })
      if (signUpError) throw signUpError

      router.push("/auth/sign-up-success")
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Kayıt olurken bir hata oluştu."
      setError(translateAuthError(message))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-balance text-2xl">Hesap oluştur</CardTitle>
        <CardDescription>
          Kullanıcı adınla sohbete başla, arkadaşların seni kolayca bulsun.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Kullanıcı adı</Label>
            <div className="relative">
              <AtSign
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="username"
                type="text"
                inputMode="text"
                autoComplete="username"
                placeholder="kullanici_adi"
                required
                className="pl-9"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 karakter, sadece harf, rakam ve alt çizgi (_).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Görünen ad</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Adın Soyadın"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@eposta.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Tekrar</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 size-4" />
                Hesap oluşturuluyor…
              </>
            ) : (
              "Hesap oluştur"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Giriş yap
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("already registered") || m.includes("user already registered"))
    return "Bu e-posta ile zaten kayıt olunmuş."
  if (m.includes("password"))
    return "Şifre çok zayıf. En az 6 karakter kullan."
  if (m.includes("rate"))
    return "Çok fazla deneme yapıldı, biraz bekleyip tekrar dene."
  return message
}
