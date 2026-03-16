import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import { getMonthLabel } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  const now = new Date()
  const months = []

  for (let i = 5; i >= 0; i--) {
    const date = subMonths(now, i)
    const start = format(startOfMonth(date), 'yyyy-MM-dd')
    const end = format(endOfMonth(date), 'yyyy-MM-dd')
    const label = `${getMonthLabel(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`

    // Recebido no mês
    const { data: received } = await supabase
      .from('financial_entries')
      .select('paid_value')
      .eq('client_id', clientId)
      .eq('type', 'receivable')
      .eq('status', 'paid')
      .gte('payment_date', start)
      .lte('payment_date', end)

    // Pago no mês
    const { data: paid } = await supabase
      .from('financial_entries')
      .select('paid_value')
      .eq('client_id', clientId)
      .eq('type', 'payable')
      .eq('status', 'paid')
      .gte('payment_date', start)
      .lte('payment_date', end)

    // Previsto receber (vencimento no mês)
    const { data: expRec } = await supabase
      .from('financial_entries')
      .select('expected_value')
      .eq('client_id', clientId)
      .eq('type', 'receivable')
      .gte('due_date', start)
      .lte('due_date', end)

    // Previsto pagar
    const { data: expPay } = await supabase
      .from('financial_entries')
      .select('expected_value')
      .eq('client_id', clientId)
      .eq('type', 'payable')
      .gte('due_date', start)
      .lte('due_date', end)

    months.push({
      label,
      received: (received ?? []).reduce((s, e) => s + (e.paid_value ?? 0), 0),
      paid: (paid ?? []).reduce((s, e) => s + (e.paid_value ?? 0), 0),
      expectedReceivable: (expRec ?? []).reduce((s, e) => s + e.expected_value, 0),
      expectedPayable: (expPay ?? []).reduce((s, e) => s + e.expected_value, 0),
    })
  }

  return NextResponse.json({ months })
}
