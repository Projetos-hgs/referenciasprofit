import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const clientId = searchParams.get('clientId')
  const type = searchParams.get('type') as 'receivable' | 'payable' | null
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') ?? 'due_date'
  const dir = searchParams.get('dir') ?? 'asc'
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20')

  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  let query = supabase
    .from('financial_entries')
    .select('*', { count: 'exact' })
    .eq('client_id', clientId)

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(`description.ilike.%${search}%,person_name.ilike.%${search}%,category.ilike.%${search}%`)
  }

  query = query.order(sort, { ascending: dir === 'asc' })
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data: entries, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ entries: entries ?? [], total: count ?? 0 })
}
