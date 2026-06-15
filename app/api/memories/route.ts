import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const sessionId =
      req.nextUrl.searchParams.get('sessionId') ||
      req.cookies.get('echobond_session')?.value
    if (!sessionId) return NextResponse.json({ error: 'No session' }, { status: 400 })

    const { data: memories } = await supabaseAdmin
      .from('long_term_memories')
      .select('*')
      .eq('session_id', sessionId)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })

    const { data: milestones } = await supabaseAdmin
      .from('milestones')
      .select('*')
      .eq('session_id', sessionId)
      .order('achieved_at', { ascending: true })

    return NextResponse.json({
      memories: memories || [],
      milestones: milestones || [],
    })
  } catch (err) {
    console.error('Memories error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
