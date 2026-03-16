import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import { getMonthLabel } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const monthsCount = parseInt(searchParams.get('months') ?? '6')

  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  const now = new Date()
  const months = []

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = subMonths(now, i)
    const start = format(startOfMonth(date), 'yyyy-MM-dd')
    const end = format(endOfMonth(date), 'yyyy-MM-dd')
    const label = `${getMonthLabel(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`

    const { data: received } = await supabase
      .from('financial_entries')
      .select('paid_value')
      .eq('client_id', clientId)
      .eq('type', 'receivable')
      .eq('status', 'paid')
      .gte('payment_date', start)
      .lte('payment_date', end)

    const { data: paid } = await supabase
      .from('financial_entries')
      .select('paid_value')
      .eq('client_id', clientId)
      .eq('type', 'payable')
      .eq('status', 'paid')
      .gte('payment_date', start)
      .lte('payment_date', end)

    months.push({
      label,
      received: (received ?? []).reduce((s, e) => s + (e.paid_value ?? 0), 0),
      paid: (paid ?? []).reduce((s, e) => s + (e.paid_value ?? 0), 0),
    })
  }

  return NextResponse.json({ months })
}
