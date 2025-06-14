import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "@/app/ClientLayout" // Fixed import path

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  // This is correct
  title: "Call Management System",
  description: "A comprehensive system for managing calls and contacts",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
