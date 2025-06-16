"use client"

import type React from "react"
import { AuthProvider } from "@/lib/auth-context"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen">{children}</div>
    </AuthProvider>
  )
}
