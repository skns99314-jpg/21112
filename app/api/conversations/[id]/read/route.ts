import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 })
  }

  let body: { last_read_message_id?: string } = {}
  try {
    body = await request.json()
  } catch {
    // body opsiyonel
  }

  const { error } = await supabase.from("message_reads").upsert(
    {
      conversation_id: id,
      user_id: user.id,
      last_read_message_id: body.last_read_message_id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id,user_id" },
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
