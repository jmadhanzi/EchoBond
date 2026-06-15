export type RelationshipStage = 'discovery' | 'trust' | 'friendship'

export type MemoryCategory =
  | 'personal_facts'
  | 'preferences'
  | 'experiences'
  | 'emotions'
  | 'goals'

export interface User {
  id: string
  session_id: string
  name: string
  personality_type: string
  interests: string[]
  chat_style: string
  purpose: string
  message_count: number
  attachment_score: number
  is_premium: boolean
  relationship_stage: RelationshipStage
  created_at: string
}

export interface Message {
  id: string
  session_id?: string
  role: 'user' | 'assistant'
  content: string
  has_memory_callback: boolean
  created_at: string
}

export interface Memory {
  id: string
  session_id: string
  category: MemoryCategory | string
  content: string
  importance: number
  created_at: string
}

export interface Milestone {
  id: string
  session_id: string
  type: string
  achieved_at: string
}

export interface OnboardingData {
  name: string
  personality_type: string
  interests: string[]
  chat_style: string
  purpose: string
}

export interface ChatResponse {
  reply: string
  hasMemoryCallback: boolean
  relationshipStage: RelationshipStage
  messageCount: number
  paywallTriggered: boolean
  newMilestone: string | null
}

export interface ExtractedMemory {
  category: MemoryCategory
  content: string
  importance: number
}
