import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'

export default function ChatPage() {
  const sessionId = cookies().get('echobond_session')?.value
  if (!sessionId) redirect('/onboard')
  return <ChatInterface sessionId={sessionId} />
}
