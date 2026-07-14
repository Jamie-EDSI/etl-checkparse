import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pre-ETS Check Parser',
  description: 'Upload a check PDF and extract student payment data into your tracking spreadsheet.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
