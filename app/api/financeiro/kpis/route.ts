import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const type = searchParams.get('type') as 'receivable' | 'payable'

  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const { data: all } = await supabase
    .from('financial_entries')
    .select('expected_value, paid_value, status, payment_date')
    .eq('client_id', clientId)
    .eq('type', type)

  const entries = all ?? []

  const open = entries.filter((e) => e.status === 'open').reduce((s, e) => s + e.expected_value, 0)
  const overdue = entries.filter((e) => e.status === 'overdue').reduce((s, e) => s + e.expected_value, 0)
  const total = entries.reduce((s, e) => s + e.expected_value, 0)
  const paidMonth = entries
    .filter((e) => e.status === 'paid' && e.payment_date && e.payment_date >= monthStart && e.payment_date <= monthEnd)
    .reduce((s, e) => s + (e.paid_value ?? 0), 0)

  return NextResponse.json({ open, overdue, total, paidMonth })
}
