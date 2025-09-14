import type React from "react"

type Props = React.PropsWithChildren<{ className?: string }>

export function GlassCard({ className = "", children }: Props) {
  return <div className={`glass neon-border rounded-xl glass-hover smooth ${className}`}>{children}</div>
}
