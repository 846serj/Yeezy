import type { Metadata, Viewport } from 'next'
import './globals.css'
import '../styles/gutenberg.css'
import Script from 'next/script'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'WordPress Article Editor - TuiCss',
  description: 'A DOS-style text-based interface for editing WordPress articles',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
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
        <AuthProvider>
          {children}
        </AuthProvider>
        <Script src="/tuicss/tuicss.min.js" />
      </body>
    </html>
  )
}
