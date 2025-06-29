import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Synthetica Prototype 2",
  description: "MMOゲームのプロトタイプ - 自律エージェントが環境中で活動するゲーム",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
