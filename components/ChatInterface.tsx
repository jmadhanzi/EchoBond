'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { Message, ChatResponse } from '@/types'

interface Props {
  sessionId: string
}

const STAGE_LABELS: Record<string, string> = {
  discovery: 'Discovery',
  trust: 'Building Trust',
  friendship: 'Friendship',
}

const STAGE_PROGRESS: Record<string, number> = {
  discovery: 20,
  trust: 55,
  friendship: 90,
}

export default function ChatInterface({ sessionId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('discovery')
  const [messageCount, setMessageCount] = useState(0)
  const [milestone, setMilestone] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [userName, setUserName] = useState('')
  const [memoryCount, setMemoryCount] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!milestone) return
    const t = setTimeout(() => setMilestone(null), 4000)
    return () => clearTimeout(t)
  }, [milestone])

  // Load user + message history on mount
  useEffect(() => {
    async function init() {
      try {
        const [userRes, msgRes, memRes] = await Promise.all([
          fetch(`/api/user?sessionId=${sessionId}`),
          fetch(`/api/messages?sessionId=${sessionId}`),
          fetch(`/api/memories?sessionId=${sessionId}`),
        ])
        const [userData, msgData, memData] = await Promise.all([
          userRes.json(),
          msgRes.json(),
          memRes.json(),
        ])
        if (userData.user) {
          setStage(userData.user.relationship_stage || 'discovery')
          setMessageCount(userData.user.message_count || 0)
          setUserName(userData.user.name || '')
        }
        if (msgData.messages) setMessages(msgData.messages)
        if (memData.memories) setMemoryCount(memData.memories.length)
      } catch {
        // ignore
      } finally {
        setInitialized(true)
      }
    }
    init()
  }, [sessionId])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = {
      id: `tmp-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: text,
      has_memory_callback: false,
      created_at: new Date().toISOString(),
    }
    setMessages(m => [...m, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: messages.slice(-20),
        }),
      })

      const data: ChatResponse & { error?: string } = await res.json()

      if (data.paywallTriggered) {
        setShowPaywall(true)
        setLoading(false)
        return
      }

      if (data.error) throw new Error(data.error)

      const assistantMsg: Message = {
        id: `tmp-${Date.now() + 1}`,
        session_id: sessionId,
        role: 'assistant',
        content: data.reply,
        has_memory_callback: data.hasMemoryCallback,
        created_at: new Date().toISOString(),
      }
      setMessages(m => [...m, assistantMsg])
      setStage(data.relationshipStage || stage)
      setMessageCount(data.messageCount || messageCount + 1)
      if (data.newMilestone) setMilestone(data.newMilestone)
      if (data.hasMemoryCallback) setMemoryCount(c => c + 1)
    } catch {
      setMessages(m => [
        ...m,
        {
          id: `err-${Date.now()}`,
          session_id: sessionId,
          role: 'assistant',
          content: "Sorry, I had a moment there. Can you say that again?",
          has_memory_callback: false,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages, sessionId, stage, messageCount])

  if (showPaywall) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full bg-[#1E293B] rounded-3xl p-8 border border-slate-700 text-center">
          <div className="text-5xl mb-4">🔮</div>
          <h2 className="text-2xl font-bold text-white mb-2">Keep going</h2>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            You&apos;ve used your free messages. Upgrade to keep building your relationship with Echo — your memories and progress are saved.
          </p>
          <Link href="/subscription"
            className="block w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity mb-3">
            See plans →
          </Link>
          <button onClick={() => setShowPaywall(false)}
            className="text-slate-500 text-sm hover:text-slate-300 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-[#0F172A]/95 backdrop-blur sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-lg shadow-md flex-shrink-0">
          🔮
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">Echo</div>
          <div className="text-xs text-slate-400 truncate">
            {STAGE_LABELS[stage] || 'Discovery'} · {memoryCount} {memoryCount === 1 ? 'memory' : 'memories'}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-400 rounded-full transition-all duration-1000"
              style={{ width: `${STAGE_PROGRESS[stage] || 20}%` }}
            />
          </div>
        </div>
        <Link href="/memory-book"
          className="flex-shrink-0 text-xs text-slate-400 hover:text-violet-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800">
          📖 Memories
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide pb-2">
        {!initialized && (
          <div className="text-center text-slate-500 mt-12 text-sm">Loading...</div>
        )}

        {initialized && messages.length === 0 && (
          <div className="text-center mt-16">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-slate-400 text-sm">Say hello to start your conversation with Echo</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">
                🔮
              </div>
            )}
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-sm'
                : msg.has_memory_callback
                  ? 'bg-[#1E293B] border border-orange-500/30 text-slate-100 rounded-bl-sm'
                  : 'bg-[#1E293B] text-slate-100 rounded-bl-sm'
            }`}>
              {msg.has_memory_callback && msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-[11px] text-orange-400 font-medium">💭 remembers</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-sm mr-2 flex-shrink-0">
              🔮
            </div>
            <div className="bg-[#1E293B] px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Soft paywall nudge */}
      {messageCount >= 10 && messageCount < 13 && (
        <div className="mx-4 mb-2 px-3 py-2 bg-violet-900/20 border border-violet-700/30 rounded-xl flex items-center justify-between">
          <span className="text-violet-300 text-xs">{13 - messageCount} free {13 - messageCount === 1 ? 'message' : 'messages'} left</span>
          <Link href="/subscription" className="text-violet-400 text-xs font-medium hover:text-violet-300">
            Upgrade →
          </Link>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 bg-[#0F172A]">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            className="flex-1 bg-[#1E293B] border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder={`Message Echo${userName ? `, ${userName.split(' ')[0]}` : ''}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            disabled={loading}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-violet-600 disabled:opacity-40 rounded-full flex items-center justify-center hover:bg-violet-500 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Milestone toast */}
      {milestone && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
          <div className="bg-[#1E293B] border border-violet-500/50 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium whitespace-nowrap">
            🌱 {milestone}
          </div>
        </div>
      )}
    </div>
  )
}
