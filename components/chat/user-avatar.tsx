import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { colorFromString, initialsFrom } from "@/lib/gobak-utils"
import { cn } from "@/lib/utils"

type Props = {
  name: string
  seed?: string
  src?: string | null
  className?: string
}

export function UserAvatar({ name, seed, src, className }: Props) {
  const key = seed ?? name
  const bg = colorFromString(key)
  return (
    <Avatar className={cn("size-10", className)}>
      {src ? <AvatarImage src={src || "/placeholder.svg"} alt={name} /> : null}
      <AvatarFallback
        className="font-medium text-white"
        style={{ backgroundColor: bg }}
      >
        {initialsFrom(name)}
      </AvatarFallback>
    </Avatar>
  )
}
