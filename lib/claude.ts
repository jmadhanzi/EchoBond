import Anthropic from '@anthropic-ai/sdk'
import type { ExtractedMemory } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

const CHAT_MODEL = 'claude-sonnet-4-6'
const EXTRACT_MODEL = 'claude-haiku-4-5-20251001'

const MEMORY_PHRASES =
  /remember when|you (told|mentioned|said|were)|last time|we talked about|you've been|how (did|is|are) (that|your|the)/i

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithEcho(
  systemPrompt: string,
  messages: ChatTurn[],
): Promise<{ text: string; hasMemoryCallback: boolean }> {
  const response = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 700,
    system: systemPrompt,
    messages,
  })

  const text =
    response.content[0]?.type === 'text' ? response.content[0].text : ''
  const hasMemoryCallback = MEMORY_PHRASES.test(text)

  return { text, hasMemoryCallback }
}

export async function extractMemoriesWithClaude(
  userName: string,
  userMessage: string,
  assistantMessage: string,
): Promise<ExtractedMemory[]> {
  const prompt = `You extract durable memories about ${userName} from a conversation, so an AI companion can remember them later.

Return ONLY a JSON array (no prose, no markdown fences). If nothing is worth remembering, return [].

Each memory object must be:
{"category": "personal_facts" | "preferences" | "experiences" | "emotions" | "goals", "content": "concise statement worth remembering", "importance": 1-10}

Conversation:
${userName}: "${userMessage}"
Echo: "${assistantMessage}"

Extract at most 4 memories. Only include concrete, durable facts/preferences/experiences/emotions/goals about ${userName}. Skip small talk.`

  try {
    const response = await client.messages.create({
      model: EXTRACT_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text =
      response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : '[]'
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []

    const parsed = JSON.parse(match[0]) as ExtractedMemory[]
    const allowed = new Set([
      'personal_facts',
      'preferences',
      'experiences',
      'emotions',
      'goals',
    ])

    return parsed
      .filter(m => m && m.content && allowed.has(m.category))
      .map(m => ({
        category: m.category,
        content: String(m.content).slice(0, 500),
        importance: Math.min(10, Math.max(1, Number(m.importance) || 5)),
      }))
  } catch {
    return []
  }
}
