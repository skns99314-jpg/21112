import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 })
  }

  let body: { display_name?: string; bio?: string; avatar_url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.display_name === "string") {
    const trimmed = body.display_name.trim()
    if (!trimmed) {
      return NextResponse.json(
        { error: "Görünen ad boş olamaz" },
        { status: 400 },
      )
    }
    update.display_name = trimmed.slice(0, 40)
  }
  if (typeof body.bio === "string") {
    update.bio = body.bio.trim().slice(0, 160) || null
  }
  if (typeof body.avatar_url === "string") {
    update.avatar_url = body.avatar_url || null
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ profile: data })
}
