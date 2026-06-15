'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Memory, Milestone } from '@/types'

interface Props {
  sessionId: string
}

const CATEGORY_ICONS: Record<string, string> = {
  personal_facts: '📌',
  preferences: '❤️',
  experiences: '🌟',
  emotions: '💙',
  goals: '🎯',
}

const CATEGORY_LABELS: Record<string, string> = {
  personal_facts: 'Personal Facts',
  preferences: 'Preferences',
  experiences: 'Experiences',
  emotions: 'Emotions',
  goals: 'Goals',
}

const MILESTONE_ICONS: Record<string, string> = {
  first_conversation: '🌟',
  trust: '🤝',
  friendship: '💚',
}

export default function MemoryBook({ sessionId }: Props) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'memories' | 'milestones'>('memories')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/memories?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(d => {
        setMemories(d.memories || [])
        setMilestones(d.milestones || [])
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  const grouped = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    const cat = m.category || 'personal_facts'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {})

  const share = async () => {
    const lines = memories.slice(0, 6).map(m => `• ${m.content}`)
    await navigator.clipboard.writeText(`My Echo memories:\n${lines.join('\n')}\n\n— EchoBond`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/chat"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1E293B] hover:bg-slate-700 transition-colors text-slate-400 text-lg">
          ←
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Memory Book</h1>
          <p className="text-slate-400 text-sm">{memories.length} {memories.length === 1 ? 'memory' : 'memories'} · {milestones.length} milestones</p>
        </div>
        {memories.length > 0 && (
          <button onClick={share}
            className="px-3 py-1.5 bg-[#1E293B] border border-slate-700 rounded-xl text-sm text-slate-300 hover:border-violet-500 transition-colors">
            {copied ? '✓ Copied' : '📤 Share'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1E293B] p-1 rounded-xl mb-6">
        {(['memories', 'milestones'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center text-slate-500 py-12 text-sm">Loading your memories...</div>
      )}

      {!loading && tab === 'memories' && (
        <>
          {memories.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🌱</div>
              <p className="text-slate-400 mb-2 font-medium">No memories yet</p>
              <p className="text-slate-500 text-sm mb-6">Chat with Echo — the more you share, the more Echo will remember.</p>
              <Link href="/chat"
                className="inline-block px-5 py-2.5 bg-violet-600 rounded-xl text-white text-sm font-medium hover:bg-violet-500 transition-colors">
                Chat with Echo →
              </Link>
            </div>
          ) : (
            Object.entries(grouped).map(([category, mems]) => (
              <div key={category} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{CATEGORY_ICONS[category] || '📌'}</span>
                  <span className="text-white font-semibold text-sm">{CATEGORY_LABELS[category] || category}</span>
                  <span className="text-xs text-slate-500 ml-1">({mems.length})</span>
                </div>
                <div className="space-y-2">
                  {mems.map(m => (
                    <div key={m.id} className="bg-[#1E293B] rounded-xl p-3 border border-slate-800/80">
                      <p className="text-slate-300 text-sm leading-relaxed">{m.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600/60 rounded-full" style={{ width: `${(m.importance / 10) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-600 flex-shrink-0">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {!loading && tab === 'milestones' && (
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No milestones yet — keep chatting!
            </div>
          ) : (
            milestones.map(m => (
              <div key={m.id} className="bg-[#1E293B] rounded-xl p-4 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-900/40 border border-violet-500/30 flex items-center justify-center text-xl flex-shrink-0">
                  {MILESTONE_ICONS[m.type] || '🎉'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium capitalize">
                    {m.type === 'first_conversation' ? 'First Conversation' :
                     m.type === 'trust' ? 'Reached Trust Stage' :
                     m.type === 'friendship' ? 'Became Friends' : m.type}
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    {new Date(m.achieved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
