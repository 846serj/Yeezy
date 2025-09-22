import type { Metadata } from 'next'
import './globals.css'
import '../styles/gutenberg.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'WordPress Article Editor - TuiCss',
  description: 'A DOS-style text-based interface for editing WordPress articles',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="tui-bg-blue-white">
      <head>
        <link rel="stylesheet" href="/tuicss/tuicss.min.css" />
        {/* Font system is now handled by CSS imports */}
      </head>
      <body>
        {children}
        <Script src="/tuicss/tuicss.min.js" />
      </body>
    </html>
  )
}
