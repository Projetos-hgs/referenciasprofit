import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())

  if (!clientId) return NextResponse.json({ rows: [], months: [] })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Buscar config DRE do cliente
  const { data: dreConfig } = await supabase
    .from('dre_config')
    .select('*')
    .eq('client_id', clientId)
    .order('line_order', { ascending: true })

  if (!dreConfig || dreConfig.length === 0) {
    return NextResponse.json({ rows: [], months: Array.from({ length: 12 }, (_, i) => i + 1) })
  }

  // Buscar lançamentos pagos/recebidos do ano
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const { data: entries } = await supabase
    .from('financial_entries')
    .select('category, subcategory, type, expected_value, paid_value, payment_date, status')
    .eq('client_id', clientId)
    .in('status', ['paid'])
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  // Agrupar por categoria e mês
  const categoryMonthMap: Record<string, Record<number, number>> = {}

  for (const entry of entries ?? []) {
    if (!entry.payment_date) continue
    const month = new Date(entry.payment_date + 'T00:00:00').getMonth() + 1
    const key = (entry.category ?? 'Sem categoria').toLowerCase()
    if (!categoryMonthMap[key]) categoryMonthMap[key] = {}
    const value = Number(entry.paid_value || entry.expected_value || 0)
    categoryMonthMap[key][month] = (categoryMonthMap[key][month] ?? 0) + value
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  // Calcular linhas DRE
  const subtotals: Record<string, Record<number, number>> = {}

  const rows = dreConfig.map((config) => {
    const values: Record<number, number> = {}

    if (config.line_type !== 'subtotal' && config.line_type !== 'total') {
      const codes: string[] = config.category_codes ?? []
      const isExpense = config.line_type === 'expense' || config.line_type === 'cost' || config.line_type === 'deduction'

      for (const month of months) {
        let sum = 0
        for (const code of codes) {
          sum += categoryMonthMap[code.toLowerCase()]?.[month] ?? 0
        }
        values[month] = isExpense ? -Math.abs(sum) : Math.abs(sum)
      }
    } else if (config.formula) {
      // formula: ex. "receita_bruta - deducoes"
      const parts = config.formula.split(/[\s+-]+/).filter(Boolean)
      const ops = config.formula.match(/[+-]/g) ?? []

      for (const month of months) {
        let total = subtotals[parts[0]]?.[month] ?? 0
        ops.forEach((op, i) => {
          const val = subtotals[parts[i + 1]]?.[month] ?? 0
          total = op === '+' ? total + val : total - val
        })
        values[month] = total
      }
    }

    // Armazenar subtotal para fórmulas futuras
    const slug = config.line_label.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    subtotals[slug] = values

    const total = Object.values(values).reduce((a, b) => a + b, 0)

    return {
      label: config.line_label,
      type: config.line_type,
      isBold: config.is_bold,
      values,
      total,
    }
  })

  return NextResponse.json({ rows, months })
}
