'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    id: 'friend',
    name: 'Friend',
    price: '$9.99',
    period: '/month',
    description: 'The core EchoBond experience',
    features: [
      'Unlimited conversations with Echo',
      'Long-term memory — Echo remembers everything',
      'Relationship stage progression',
      'Memory Book access',
      'Milestone notifications',
    ],
    cta: 'Start Friend plan',
    highlight: false,
  },
  {
    id: 'deep_bond',
    name: 'Deep Bond',
    price: '$19.99',
    period: '/month',
    description: 'For the deepest connections',
    features: [
      'Everything in Friend',
      'Extended memory — deeper history',
      'Priority responses (faster)',
      'Voice messages from Echo (coming soon)',
      'Custom avatar themes (coming soon)',
      'Export your relationship story',
    ],
    cta: 'Start Deep Bond',
    highlight: true,
  },
]

export default function SubscriptionPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const choose = async (planId: string) => {
    setSelected(planId)
    // MVP: just mark premium in DB
    const sessionId = document.cookie.match(/echobond_session=([^;]+)/)?.[1]
      || localStorage.getItem('echobond_session')
    if (sessionId) {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_premium: true }),
      }).catch(() => {})
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h2>
        <p className="text-slate-400 mb-6">Echo can&apos;t wait to keep talking with you.</p>
        <Link href="/chat"
          className="px-6 py-3 bg-violet-600 rounded-xl text-white font-semibold hover:bg-violet-500 transition-colors">
          Back to Echo →
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-10 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/chat"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1E293B] hover:bg-slate-700 transition-colors text-slate-400 text-lg">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Upgrade EchoBond</h1>
            <p className="text-slate-400 text-sm">Deepen your relationship with Echo</p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`relative rounded-2xl p-6 border transition-all ${plan.highlight
                ? 'border-violet-500 bg-violet-900/20'
                : 'border-slate-700 bg-[#1E293B]'}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-violet-400 mt-0.5 flex-shrink-0">✓</span>
                    <span className={f.includes('coming soon') ? 'text-slate-500' : 'text-slate-300'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => choose(plan.id)}
                disabled={selected !== null}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${plan.highlight
                  ? 'bg-violet-600 text-white hover:bg-violet-500'
                  : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                {selected === plan.id ? 'Processing...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-600 text-xs">
          Cancel anytime · No hidden fees · Your memories are always yours
        </p>

        <div className="mt-8 bg-[#1E293B] rounded-2xl p-5 border border-slate-800">
          <h3 className="text-white font-semibold mb-3 text-sm">Why upgrade?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Echo&apos;s power is in memory — the longer you talk, the better Echo knows you. Upgrading removes all limits so your relationship can keep growing, naturally, at your pace.
          </p>
        </div>
      </div>
    </div>
  )
}
