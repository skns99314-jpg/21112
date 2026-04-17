"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Giriş yapılırken bir hata oluştu."
      setError(translateAuthError(message))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-balance text-2xl">Tekrar hoş geldin</CardTitle>
        <CardDescription>
          E-posta ve şifrenle GobakChat hesabına giriş yap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Şifre</Label>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
                Giriş yapılıyor…
              </>
            ) : (
              "Giriş yap"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Hesabın yok mu?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Kayıt ol
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials"))
    return "E-posta veya şifre hatalı."
  if (m.includes("email not confirmed"))
    return "E-posta adresini doğrulamalısın. Gelen kutunu kontrol et."
  if (m.includes("rate"))
    return "Çok fazla deneme yapıldı, biraz bekleyip tekrar dene."
  return message
}
