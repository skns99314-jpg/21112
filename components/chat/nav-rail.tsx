"use client"

import { GobakLogo } from "@/components/gobak-logo"
import { UserAvatar } from "@/components/chat/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Profile } from "@/lib/types"
import { LogOut, MessageSquare, Settings, User } from "lucide-react"
import { useState } from "react"
import { ProfileDialog } from "@/components/chat/profile-dialog"

type Props = {
  profile: Profile
}

export function NavRail({ profile }: Props) {
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/auth/login"
  }

  return (
    <aside className="hidden h-full w-16 shrink-0 flex-col items-center justify-between border-r border-border/60 bg-sidebar py-4 sm:flex">
      <div className="flex flex-col items-center gap-3">
        <GobakLogo className="size-9" aria-label="GobakChat" />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Sohbetler"
          className="rounded-xl bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary"
        >
          <MessageSquare className="size-5" />
        </Button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full outline-none ring-primary/40 transition focus-visible:ring-2"
              aria-label="Profil menüsü"
            >
              <UserAvatar
                name={profile.display_name}
                seed={profile.username}
                src={profile.avatar_url}
                className="size-10 ring-2 ring-border/70"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {profile.display_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{profile.username}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
              <User className="size-4" />
              Profilim
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="size-4" />
              Ayarlar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={handleLogout}
            >
              <LogOut className="size-4" />
              Çıkış yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={profile}
      />
    </aside>
  )
}
