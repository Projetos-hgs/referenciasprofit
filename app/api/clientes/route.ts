import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ clients: [] })

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients: clients ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()

  let orgId = profile?.organization_id
  if (!orgId) {
    // Criar organização automaticamente no primeiro cliente
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: user.email?.split('@')[0] ?? 'Minha Org', slug: slugify(user.email ?? 'org') })
      .select()
      .single()
    if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })
    orgId = org.id
    await supabase.from('users').update({ organization_id: orgId }).eq('id', user.id)
  }

  const body = await req.json()
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...body, organization_id: orgId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
