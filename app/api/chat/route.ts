import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { chatWithEcho, ChatTurn } from '@/lib/claude'
import {
  buildSystemPrompt,
  determineRelationshipStage,
  calculateAttachmentIncrement,
} from '@/lib/personality'
import { getRelevantMemories } from '@/lib/memory'
import type { User, Message } from '@/types'

const FREE_MESSAGE_LIMIT = 13

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message: string = body.message
    const history: Message[] = body.history || []

    const cookieSession = cookies().get('echobond_session')?.value
    const sessionId: string | undefined = body.sessionId || cookieSession

    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 })
    }

    // Load user profile.
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (userErr || !userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userRow as User

    // Paywall: block once the free limit is reached for non-premium users.
    if (!user.is_premium && user.message_count >= FREE_MESSAGE_LIMIT) {
      return NextResponse.json({
        reply: '',
        hasMemoryCallback: false,
        relationshipStage: user.relationship_stage,
        messageCount: user.message_count,
        paywallTriggered: true,
        newMilestone: null,
      })
    }

    // Load memories and build prompt.
    const memories = await getRelevantMemories(sessionId, 20)
    const systemPrompt = buildSystemPrompt(user, memories)

    // Build conversation for Claude from the client history (last 20) + new message.
    const trimmed = history.slice(-20)
    const messagesForClaude: ChatTurn[] = [
      ...trimmed.map(m => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const { text, hasMemoryCallback } = await chatWithEcho(
      systemPrompt,
      messagesForClaude,
    )

    // Persist both messages.
    await supabaseAdmin.from('messages').insert([
      { session_id: sessionId, role: 'user', content: message, has_memory_callback: false },
      {
        session_id: sessionId,
        role: 'assistant',
        content: text,
        has_memory_callback: hasMemoryCallback,
      },
    ])

    // Update counters and stage.
    const newMessageCount = user.message_count + 1
    const newAttachmentScore =
      user.attachment_score + calculateAttachmentIncrement(message)
    const newStage = determineRelationshipStage(newMessageCount)
    const stageAdvanced = newStage !== user.relationship_stage

    await supabaseAdmin
      .from('users')
      .update({
        message_count: newMessageCount,
        attachment_score: newAttachmentScore,
        relationship_stage: newStage,
      })
      .eq('session_id', sessionId)

    // Record a milestone when the stage advances.
    let newMilestone: string | null = null
    if (stageAdvanced) {
      const labels: Record<string, string> = {
        trust: "You've reached the Trust stage with Echo!",
        friendship: "You and Echo are friends now!",
      }
      newMilestone = labels[newStage] || null
      if (newMilestone) {
        await supabaseAdmin
          .from('milestones')
          .insert({ session_id: sessionId, type: newStage })
      }
    }

    // Fire-and-forget memory extraction.
    const origin = req.nextUrl.origin
    fetch(`${origin}/api/extract-memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userMessage: message,
        assistantMessage: text,
      }),
    }).catch(() => {})

    // Paywall trigger flag for the *next* turn.
    const paywallTriggered =
      !user.is_premium && newMessageCount >= FREE_MESSAGE_LIMIT

    return NextResponse.json({
      reply: text,
      hasMemoryCallback,
      relationshipStage: newStage,
      messageCount: newMessageCount,
      paywallTriggered,
      newMilestone,
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
