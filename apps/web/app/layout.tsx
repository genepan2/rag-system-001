import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RAG System',
  description: 'A comprehensive RAG system for document processing and retrieval',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}