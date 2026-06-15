import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractMemories } from '@/lib/memory'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userMessage, assistantMessage } = await req.json()
    if (!sessionId) return NextResponse.json({ extracted: 0 })

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('session_id', sessionId)
      .single()

    if (!user) return NextResponse.json({ extracted: 0 })

    const count = await extractMemories(
      sessionId,
      user.name,
      userMessage,
      assistantMessage,
    )

    return NextResponse.json({ extracted: count })
  } catch (err) {
    console.error('Memory extraction error:', err)
    return NextResponse.json({ extracted: 0 })
  }
}
