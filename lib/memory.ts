import { supabaseAdmin } from '@/lib/supabase'
import { extractMemoriesWithClaude } from '@/lib/claude'
import type { Memory } from '@/types'

// Extract memories from a message pair and persist them. Returns count saved.
export async function extractMemories(
  sessionId: string,
  userName: string,
  userMessage: string,
  assistantMessage: string,
): Promise<number> {
  const extracted = await extractMemoriesWithClaude(
    userName,
    userMessage,
    assistantMessage,
  )

  if (extracted.length === 0) return 0

  const { error } = await supabaseAdmin.from('long_term_memories').insert(
    extracted.map(m => ({
      session_id: sessionId,
      category: m.category,
      content: m.content,
      importance: m.importance,
    })),
  )

  if (error) {
    console.error('Failed to save memories:', error)
    return 0
  }

  return extracted.length
}

// Retrieve the most relevant memories for a session (highest importance first).
export async function getRelevantMemories(
  sessionId: string,
  limit = 20,
): Promise<Memory[]> {
  const { data, error } = await supabaseAdmin
    .from('long_term_memories')
    .select('*')
    .eq('session_id', sessionId)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch memories:', error)
    return []
  }

  return (data || []) as Memory[]
}

// Build a human-readable memory context string for prompting/debugging.
export function buildMemoryContext(memories: Memory[]): string {
  if (memories.length === 0) return ''
  return memories.map(m => `- (${m.category}) ${m.content}`).join('\n')
}
