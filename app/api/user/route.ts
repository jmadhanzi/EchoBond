import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const sessionId =
      req.nextUrl.searchParams.get('sessionId') ||
      req.cookies.get('echobond_session')?.value
    if (!sessionId) return NextResponse.json({ error: 'No session' }, { status: 400 })

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('User error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
