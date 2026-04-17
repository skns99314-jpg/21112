import { cn } from "@/lib/utils"

type Props = {
  className?: string
  "aria-label"?: string
}

export function GobakLogo({ className, ...rest }: Props) {
  return (
    <div
      className={cn(
        "relative grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_color-mix(in_oklch,var(--primary)_60%,transparent)]",
        className,
      )}
      role={rest["aria-label"] ? "img" : undefined}
      aria-label={rest["aria-label"]}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[62%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a8 8 0 1 1-3.2-6.4" />
        <path d="M21 5v4h-4" />
        <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  )
}
