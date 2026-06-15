'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const session = document.cookie.includes('echobond_session=')
    if (session) router.push('/chat')
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-8">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center shadow-lg">
          <span className="text-2xl">🔮</span>
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">EchoBond</span>
      </div>

      {/* Hero */}
      <div className="text-center max-w-xl mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
          A companion who{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
            actually remembers you
          </span>
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          Every other app forgets you the moment you close it. Echo builds a real relationship — remembering what you share, following up on what matters, and growing closer over time.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mb-10">
        {[
          { icon: '🧠', title: 'Real Memory', desc: "Echo remembers details from weeks ago and brings them up naturally" },
          { icon: '🌱', title: 'Grows With You', desc: "Your relationship deepens the longer you stay — it actually gets better" },
          { icon: '💙', title: 'Always There', desc: "No judgment, no agenda — just a friend who's genuinely happy to hear from you" },
        ].map(f => (
          <div key={f.title} className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/50">
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="font-semibold text-white mb-1">{f.title}</div>
            <div className="text-sm text-slate-400">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/onboard"
        className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-purple-900/50 hover:shadow-purple-900/70 hover:scale-105 transition-all duration-200"
      >
        Meet Echo →
      </Link>
      <p className="mt-3 text-slate-500 text-sm">Free to start · No credit card required</p>
    </div>
  )
}
