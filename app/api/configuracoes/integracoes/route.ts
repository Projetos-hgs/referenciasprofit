import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ credentials: {} })

  const { data } = await supabase
    .from('client_credentials')
    .select('platform, credentials, last_sync_at')
    .eq('client_id', clientId)

  const credentials: Record<string, Record<string, string>> = {}
  let lastSync: string | null = null

  for (const row of data ?? []) {
    credentials[row.platform] = row.credentials
    if (row.last_sync_at && (!lastSync || row.last_sync_at > lastSync)) {
      lastSync = row.last_sync_at
    }
  }

  return NextResponse.json({ credentials, lastSync })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, platform, credentials } = await req.json()
  const { error } = await supabase
    .from('client_credentials')
    .upsert({ client_id: clientId, platform, credentials }, { onConflict: 'client_id,platform' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
