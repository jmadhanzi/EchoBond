import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EchoBond — A companion who actually remembers you',
  description: 'The AI companion that builds a real relationship with you over time, remembering what matters most.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0F172A] text-slate-100 antialiased">
        {children}
        <footer className="fixed bottom-0 left-0 right-0 text-center py-1 text-[10px] text-slate-600 pointer-events-none">
          Echo is an AI companion, not a mental health professional. In crisis? Please reach out to a professional.
        </footer>
      </body>
    </html>
  )
}
