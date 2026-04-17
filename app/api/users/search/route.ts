import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 })
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase()
  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .neq("id", user.id)
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ results: data ?? [] })
}
