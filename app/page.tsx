import { ChatShell } from "@/components/chat/chat-shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Profile } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  // Profil trigger'ı çalışmadıysa minimal bir fallback oluştur
  if (!profile) {
    const fallbackUsername =
      (user.user_metadata?.username as string | undefined) ??
      user.email?.split("@")[0] ??
      `user_${user.id.slice(0, 6)}`
    const fallbackDisplay =
      (user.user_metadata?.display_name as string | undefined) ??
      fallbackUsername

    await supabase.from("profiles").insert({
      id: user.id,
      username: fallbackUsername,
      display_name: fallbackDisplay,
    })
    const { data: retry } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = retry
  }

  return <ChatShell profile={profile as Profile} />
}
