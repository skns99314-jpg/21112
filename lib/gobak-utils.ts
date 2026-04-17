// Deterministic color from a string (user id / username) — used for avatar
// fallbacks so the same user always gets the same color.
const AVATAR_COLORS = [
  "#FF5A36", // coral (brand)
  "#F97316", // orange
  "#EAB308", // amber
  "#22C55E", // green
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#EC4899", // pink
  "#A855F7", // purple
  "#EF4444", // red
  "#14B8A6", // teal
]

export function colorFromString(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (sameDay) {
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    return d.toLocaleDateString("tr-TR", { weekday: "short" })
  }
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
  })
}

export function formatFullTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function validateUsername(username: string): string | null {
  if (!username) return "Kullanıcı adı gerekli."
  if (username.length < 3) return "Kullanıcı adı en az 3 karakter olmalı."
  if (username.length > 20) return "Kullanıcı adı en fazla 20 karakter olabilir."
  if (!/^[a-z0-9_]+$/.test(username))
    return "Sadece küçük harf, rakam ve alt çizgi (_) kullanılabilir."
  return null
}

export function conversationDisplayName(
  item: {
    conversation: { is_group: boolean; title: string | null }
    other: { display_name: string; username: string } | null
    members: { display_name: string }[]
  },
): string {
  if (!item.conversation.is_group) {
    return item.other?.display_name ?? "Bilinmeyen"
  }
  if (item.conversation.title) return item.conversation.title
  return item.members.map((m) => m.display_name).join(", ")
}
