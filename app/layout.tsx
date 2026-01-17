import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stack Spinner',
  description: 'Spin your perfect desk setup',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50">
        {children}
      </body>
    </html>
  )
}
