import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import MemoryBook from '@/components/MemoryBook'

export default function MemoryBookPage() {
  const sessionId = cookies().get('echobond_session')?.value
  if (!sessionId) redirect('/onboard')
  return <MemoryBook sessionId={sessionId} />
}
