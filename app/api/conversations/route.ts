import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * GET /api/conversations
 * Returns all conversations the current user is a member of, with:
 * - other participant (for 1:1)
 * - last message
 * - unread count
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 })
  }

  // 1) sohbet id'leri
  const { data: myMemberships, error: memErr } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", user.id)

  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 500 })
  }
  const convIds = (myMemberships ?? []).map((m) => m.conversation_id)
  if (convIds.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  // 2) sohbetler
  const { data: conversations, error: convErr } = await supabase
    .from("conversations")
    .select("*")
    .in("id", convIds)
    .order("last_message_at", { ascending: false })

  if (convErr) {
    return NextResponse.json({ error: convErr.message }, { status: 500 })
  }

  // 3) tüm üyeler + profiller
  const { data: allMembers, error: mErr } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, profiles(id, username, display_name, avatar_url, bio)")
    .in("conversation_id", convIds)

  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 500 })
  }

  // 4) son mesajlar — her sohbet için
  const { data: lastMsgs } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false })

  const lastByConv = new Map<string, any>()
  for (const msg of lastMsgs ?? []) {
    if (!lastByConv.has(msg.conversation_id)) {
      lastByConv.set(msg.conversation_id, msg)
    }
  }

  // 5) kendi okuma durumlarım
  const { data: myReads } = await supabase
    .from("message_reads")
    .select("conversation_id, last_read_message_id, updated_at")
    .eq("user_id", user.id)
    .in("conversation_id", convIds)

  const readsByConv = new Map<string, { updated_at: string }>()
  for (const r of myReads ?? []) {
    readsByConv.set(r.conversation_id, { updated_at: r.updated_at })
  }

  // 6) okunmamış sayısı
  const unreadByConv = new Map<string, number>()
  for (const msg of lastMsgs ?? []) {
    if (msg.sender_id === user.id) continue
    const read = readsByConv.get(msg.conversation_id)
    if (!read || new Date(msg.created_at) > new Date(read.updated_at)) {
      unreadByConv.set(
        msg.conversation_id,
        (unreadByConv.get(msg.conversation_id) ?? 0) + 1,
      )
    }
  }

  // 7) birleştir
  const items = (conversations ?? []).map((c) => {
    const members = (allMembers ?? [])
      .filter((m) => m.conversation_id === c.id)
      // `profiles` gelen JOIN — tek nesne
      .map((m: any) => m.profiles)
      .filter(Boolean)

    const other = !c.is_group
      ? members.find((p: any) => p?.id !== user.id) ?? null
      : null

    return {
      conversation: c,
      other,
      members,
      last_message: lastByConv.get(c.id) ?? null,
      unread_count: unreadByConv.get(c.id) ?? 0,
    }
  })

  return NextResponse.json({ conversations: items })
}

/**
 * POST /api/conversations
 * Body: { username: string }
 * 1:1 sohbet başlatır (veya mevcut olanı döner).
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 })
  }

  let body: { username?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 })
  }

  const username = (body.username ?? "").trim().toLowerCase()
  if (!username) {
    return NextResponse.json({ error: "Kullanıcı adı gerekli" }, { status: 400 })
  }

  // Hedef kullanıcıyı bul
  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .maybeSingle()

  if (targetErr) {
    return NextResponse.json({ error: targetErr.message }, { status: 500 })
  }
  if (!target) {
    return NextResponse.json(
      { error: "Bu kullanıcı adıyla kimse bulunamadı." },
      { status: 404 },
    )
  }
  if (target.id === user.id) {
    return NextResponse.json(
      { error: "Kendine mesaj atamazsın." },
      { status: 400 },
    )
  }

  // Var olan 1:1 sohbet var mı?
  const { data: myConvs } = await supabase
    .from("conversation_members")
    .select("conversation_id, conversations!inner(id, is_group)")
    .eq("user_id", user.id)

  const candidateIds = (myConvs ?? [])
    .filter((m: any) => m.conversations && !m.conversations.is_group)
    .map((m: any) => m.conversation_id)

  if (candidateIds.length > 0) {
    const { data: shared } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", target.id)
      .in("conversation_id", candidateIds)

    if (shared && shared.length > 0) {
      return NextResponse.json({ conversation_id: shared[0].conversation_id })
    }
  }

  // Yeni sohbet oluştur
  const { data: newConv, error: convErr } = await supabase
    .from("conversations")
    .insert({
      is_group: false,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (convErr || !newConv) {
    return NextResponse.json(
      { error: convErr?.message ?? "Sohbet oluşturulamadı" },
      { status: 500 },
    )
  }

  // Üyeleri ekle (kendin önce — RLS "self" kontrolü için)
  const { error: meErr } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: newConv.id, user_id: user.id })
  if (meErr) {
    return NextResponse.json({ error: meErr.message }, { status: 500 })
  }
  const { error: otherErr } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: newConv.id, user_id: target.id })
  if (otherErr) {
    return NextResponse.json({ error: otherErr.message }, { status: 500 })
  }

  return NextResponse.json({ conversation_id: newConv.id })
}
