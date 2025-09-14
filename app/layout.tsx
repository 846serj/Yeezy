import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WordPress Article Editor',
  description: 'A modern web app for editing WordPress articles using official WordPress REST API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
