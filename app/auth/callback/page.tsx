import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const params = await searchParams
  if (params.code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(params.code)
  }
  redirect('/dashboard')
}
