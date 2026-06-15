import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const sessionId =
      req.nextUrl.searchParams.get('sessionId') ||
      req.cookies.get('echobond_session')?.value
    if (!sessionId) return NextResponse.json({ error: 'No session' }, { status: 400 })

    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100)

    return NextResponse.json({ messages: messages || [] })
  } catch (err) {
    console.error('Messages error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
