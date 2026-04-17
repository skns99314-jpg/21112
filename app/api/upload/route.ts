import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 })
    }

    // 25MB sınırı
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Dosya en fazla 25 MB olabilir." },
        { status: 413 },
      )
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin"
    const safeExt = (ext ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "")
    const filename = `gobakchat/${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${safeExt}`

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type || undefined,
    })

    let mediaType: "image" | "video" | "audio" | "file" = "file"
    if (file.type.startsWith("image/")) mediaType = "image"
    else if (file.type.startsWith("video/")) mediaType = "video"
    else if (file.type.startsWith("audio/")) mediaType = "audio"

    return NextResponse.json({ url: blob.url, media_type: mediaType })
  } catch (error) {
    console.error("[v0] upload error", error)
    return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 })
  }
}
