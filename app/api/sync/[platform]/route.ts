import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncClient } from '@/lib/sync/sync-engine'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform } = await params
  const { clientId } = await req.json()

  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  const supportedPlatforms = ['omie', 'conta_azul', 'nibo']
  if (!supportedPlatforms.includes(platform)) {
    return NextResponse.json({ error: `Plataforma '${platform}' não suportada` }, { status: 400 })
  }

  // Criar log de início
  const { data: logRow } = await supabase
    .from('sync_logs')
    .insert({ client_id: clientId, platform, sync_type: 'full', status: 'running' })
    .select()
    .single()

  try {
    const result = await syncClient(supabase, clientId, platform)

    await supabase
      .from('sync_logs')
      .update({ status: 'completed', records_synced: result.count, finished_at: new Date().toISOString() })
      .eq('id', logRow?.id)

    await supabase
      .from('client_credentials')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('platform', platform)

    return NextResponse.json({ success: true, recordsSynced: result.count })
  } catch (err: any) {
    await supabase
      .from('sync_logs')
      .update({ status: 'failed', error_message: err.message, finished_at: new Date().toISOString() })
      .eq('id', logRow?.id)

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
