import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase'
import type { OnboardingData, ExtractedMemory } from '@/types'

// Build seed memories directly from onboarding data (no Claude call).
function buildSeedMemories(data: OnboardingData): ExtractedMemory[] {
  const seeds: ExtractedMemory[] = [
    {
      category: 'personal_facts',
      content: `${data.name} describes themselves as ${data.personality_type.toLowerCase()}.`,
      importance: 7,
    },
    {
      category: 'preferences',
      content: `${data.name} prefers ${data.chat_style.toLowerCase()} when chatting.`,
      importance: 6,
    },
    {
      category: 'goals',
      content: `${data.name} is here for: ${data.purpose.toLowerCase()}.`,
      importance: 8,
    },
  ]

  if (data.interests.length > 0) {
    seeds.push({
      category: 'preferences',
      content: `${data.name} is interested in ${data.interests.join(', ')}.`,
      importance: 7,
    })
  }

  return seeds
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as OnboardingData

    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Reuse the existing session cookie if present, else create a new id.
    let sessionId = cookies().get('echobond_session')?.value
    if (!sessionId) sessionId = uuidv4()

    // Create (or upsert) the user.
    const { error: userErr } = await supabaseAdmin.from('users').upsert(
      {
        session_id: sessionId,
        name: data.name.trim(),
        personality_type: data.personality_type,
        interests: data.interests,
        chat_style: data.chat_style,
        purpose: data.purpose,
        message_count: 0,
        attachment_score: 0,
        is_premium: false,
        relationship_stage: 'discovery',
      },
      { onConflict: 'session_id' },
    )

    if (userErr) throw userErr

    // Seed memories from onboarding answers.
    const seeds = buildSeedMemories(data)
    await supabaseAdmin.from('long_term_memories').insert(
      seeds.map(m => ({
        session_id: sessionId,
        category: m.category,
        content: m.content,
        importance: m.importance,
      })),
    )

    // First-conversation milestone.
    await supabaseAdmin
      .from('milestones')
      .insert({ session_id: sessionId, type: 'first_conversation' })

    const response = NextResponse.json({ success: true, sessionId })
    response.cookies.set('echobond_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  } catch (err) {
    console.error('Onboard error:', err)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
