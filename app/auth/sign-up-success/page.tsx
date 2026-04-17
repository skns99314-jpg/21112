import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MailCheck } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="items-start">
        <div
          aria-hidden
          className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary"
        >
          <MailCheck className="size-6" />
        </div>
        <CardTitle className="text-balance text-2xl">
          E-postanı doğrula
        </CardTitle>
        <CardDescription>
          Hesabını tamamlamak için sana bir doğrulama bağlantısı gönderdik.
          Gelen kutunu kontrol et ve bağlantıya tıkla.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          E-postayı göremiyorsan spam / gereksiz klasörüne bakmayı unutma.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/auth/login">Giriş ekranına dön</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
