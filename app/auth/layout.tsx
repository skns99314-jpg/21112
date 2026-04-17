import type React from "react"
import { GobakLogo } from "@/components/gobak-logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 gbk-grid-bg"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center p-6">
        <div className="mb-8 flex items-center gap-3">
          <GobakLogo className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              GobakChat
            </h1>
            <p className="text-xs text-muted-foreground">
              Sohbet et. Bağlan. Paylaş.
            </p>
          </div>
        </div>
        {children}
      </div>
    </main>
  )
}
