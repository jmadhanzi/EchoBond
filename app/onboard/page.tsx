'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INTERESTS = ['Music', 'Books', 'Fitness', 'Tech', 'Cooking', 'Travel', 'Art', 'Gaming', 'Film', 'Nature']

const FF_STEPS = [
  'Getting to know your interests...',
  'Building your preference profile...',
  'Preparing your first conversation...',
]

type Step = 1 | 2 | 3 | 4 | 5

export default function OnboardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [fastForward, setFastForward] = useState(false)
  const [ffStep, setFfStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    purpose: '',
    personality_type: '',
    interests: [] as string[],
    chat_style: '',
  })

  const next = () => setStep(s => (s + 1) as Step)

  const toggleInterest = (i: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i],
    }))
  }

  const submit = async (chatStyle: string) => {
    const finalForm = { ...form, chat_style: chatStyle }
    setFastForward(true)

    for (let i = 0; i < FF_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900))
      setFfStep(i + 1)
    }

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalForm),
      })
      const data = await res.json()
      if (data.sessionId) {
        localStorage.setItem('echobond_session', data.sessionId)
      }
      router.push('/chat')
    } catch {
      setFastForward(false)
    }
  }

  if (fastForward) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-6">🔮</div>
        <h2 className="text-2xl font-bold text-white mb-8">Setting things up for you...</h2>
        <div className="space-y-4 w-full max-w-sm">
          {FF_STEPS.map((s, i) => (
            <div key={s} className={`flex items-center gap-3 transition-all duration-500 ${i < ffStep ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < ffStep ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-500'}`}>
                {i < ffStep ? '✓' : i + 1}
              </div>
              <span className="text-slate-300 text-sm">{s}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-violet-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-2">What should Echo call you?</h2>
            <p className="text-slate-400 mb-6">This stays between you two.</p>
            <input
              className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Your name..."
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && form.name.trim() && next()}
              autoFocus
            />
            <button onClick={next} disabled={!form.name.trim()}
              className="mt-4 w-full py-3 bg-violet-600 disabled:opacity-40 rounded-xl text-white font-semibold hover:bg-violet-500 transition-colors">
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-2">What brings you here, {form.name}?</h2>
            <p className="text-slate-400 mb-6">No wrong answers.</p>
            <div className="space-y-3">
              {[
                { v: 'Looking for connection', e: '🤝' },
                { v: 'Someone to talk to', e: '💬' },
                { v: 'Emotional support', e: '💙' },
                { v: 'Just curious about AI', e: '🔍' },
              ].map(o => (
                <button key={o.v} onClick={() => { setForm(f => ({ ...f, purpose: o.v })); next() }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 bg-[#1E293B] hover:border-violet-500 transition-all text-left">
                  <span className="text-2xl">{o.e}</span>
                  <span className="text-white font-medium">{o.v}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-2">What personality resonates?</h2>
            <p className="text-slate-400 mb-6">Echo will lean into this style.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 'Extroverted', e: '🌸', l: 'Warm & Expressive' },
                { v: 'Creative', e: '😄', l: 'Playful & Witty' },
                { v: 'Analytical', e: '🌿', l: 'Calm & Thoughtful' },
                { v: 'Introverted', e: '⚡', l: 'Deep & Reflective' },
              ].map(o => (
                <button key={o.v} onClick={() => { setForm(f => ({ ...f, personality_type: o.v })); next() }}
                  className="flex flex-col items-center p-4 rounded-xl border border-slate-700 bg-[#1E293B] hover:border-violet-500 transition-all">
                  <span className="text-3xl mb-2">{o.e}</span>
                  <span className="text-white text-sm font-medium text-center">{o.l}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-2">What do you love?</h2>
            <p className="text-slate-400 mb-6">Echo will remember these — pick as many as you like.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {INTERESTS.map(i => (
                <button key={i} onClick={() => toggleInterest(i)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${form.interests.includes(i) ? 'bg-violet-600 border-violet-500 text-white' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                  {i}
                </button>
              ))}
            </div>
            <button onClick={next} disabled={form.interests.length === 0}
              className="w-full py-3 bg-violet-600 disabled:opacity-40 rounded-xl text-white font-semibold hover:bg-violet-500 transition-colors">
              Continue →
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-2">How do you like to chat?</h2>
            <p className="text-slate-400 mb-6">Echo will match your style.</p>
            <div className="space-y-3">
              {[
                { v: 'Light and fun', e: '😊', d: 'Short messages, easy back-and-forth' },
                { v: 'Deep conversations', e: '🌊', d: 'Going below the surface, exploring ideas' },
                { v: 'Mix of both', e: '🎭', d: 'Whatever feels right in the moment' },
              ].map(o => (
                <button key={o.v} onClick={() => submit(o.v)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 bg-[#1E293B] hover:border-violet-500 transition-all text-left">
                  <span className="text-2xl">{o.e}</span>
                  <div>
                    <div className="text-white font-medium">{o.v}</div>
                    <div className="text-slate-400 text-sm">{o.d}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
