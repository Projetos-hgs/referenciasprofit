import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  // A Receber em aberto total
  const { data: receivable } = await supabase
    .from('financial_entries')
    .select('expected_value, paid_value')
    .eq('client_id', clientId)
    .eq('type', 'receivable')
    .in('status', ['open', 'overdue'])

  // A Pagar em aberto total
  const { data: payable } = await supabase
    .from('financial_entries')
    .select('expected_value, paid_value')
    .eq('client_id', clientId)
    .eq('type', 'payable')
    .in('status', ['open', 'overdue'])

  // Vencidos a receber
  const today = format(now, 'yyyy-MM-dd')
  const { data: overdueRec } = await supabase
    .from('financial_entries')
    .select('expected_value')
    .eq('client_id', clientId)
    .eq('type', 'receivable')
    .eq('status', 'overdue')

  // Resultado do mês: recebidos - pagos no período
  const { data: monthReceived } = await supabase
    .from('financial_entries')
    .select('paid_value')
    .eq('client_id', clientId)
    .eq('type', 'receivable')
    .eq('status', 'paid')
    .gte('payment_date', monthStart)
    .lte('payment_date', monthEnd)

  const { data: monthPaid } = await supabase
    .from('financial_entries')
    .select('paid_value')
    .eq('client_id', clientId)
    .eq('type', 'payable')
    .eq('status', 'paid')
    .gte('payment_date', monthStart)
    .lte('payment_date', monthEnd)

  const totalReceivable = (receivable ?? []).reduce((sum, e) => sum + (e.expected_value - (e.paid_value ?? 0)), 0)
  const totalPayable = (payable ?? []).reduce((sum, e) => sum + (e.expected_value - (e.paid_value ?? 0)), 0)
  const overdueReceivable = (overdueRec ?? []).reduce((sum, e) => sum + e.expected_value, 0)
  const totalMonthReceived = (monthReceived ?? []).reduce((sum, e) => sum + (e.paid_value ?? 0), 0)
  const totalMonthPaid = (monthPaid ?? []).reduce((sum, e) => sum + (e.paid_value ?? 0), 0)
  const netResult = totalMonthReceived - totalMonthPaid

  return NextResponse.json({
    totalReceivable,
    totalPayable,
    overdueReceivable,
    netResult,
  })
}
