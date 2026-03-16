import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  const { data: entries } = await supabase
    .from('financial_entries')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'overdue')
    .order('due_date', { ascending: true })
    .limit(20)

  return NextResponse.json({ entries: entries ?? [] })
}
