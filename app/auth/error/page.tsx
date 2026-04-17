import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">Bir şeyler ters gitti</CardTitle>
        <CardDescription>
          {params?.error ?? "Kimlik doğrulama sırasında bilinmeyen bir hata oluştu."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/auth/login">Giriş ekranına dön</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
