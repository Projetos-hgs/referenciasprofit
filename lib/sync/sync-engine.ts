import type { SupabaseClient } from '@supabase/supabase-js'
import { OmieAdapter } from './adapters/omie'
import { ContaAzulAdapter } from './adapters/conta-azul'
import { NiboAdapter } from './adapters/nibo'

export interface SyncAdapter {
  fetchReceivables(credentials: Record<string, string>): Promise<NormalizedEntry[]>
  fetchPayables(credentials: Record<string, string>): Promise<NormalizedEntry[]>
  fetchBankAccounts?(credentials: Record<string, string>): Promise<NormalizedBankAccount[]>
  fetchCategories?(credentials: Record<string, string>): Promise<NormalizedCategory[]>
}

export interface NormalizedEntry {
  external_id: string
  type: 'receivable' | 'payable'
  status: 'open' | 'paid' | 'overdue' | 'cancelled'
  description: string | null
  category: string | null
  subcategory: string | null
  cost_center: string | null
  person_name: string | null
  person_document: string | null
  issue_date: string | null
  due_date: string
  payment_date: string | null
  expected_value: number
  paid_value: number
  discount: number
  interest: number
  fine: number
  bank_account: string | null
  document_type: string | null
  notes: string | null
  raw_data: Record<string, unknown>
}

export interface NormalizedBankAccount {
  external_id: string
  name: string
  bank_name: string | null
  current_balance: number
}

export interface NormalizedCategory {
  external_id: string
  code: string | null
  name: string
  type: 'revenue' | 'expense' | 'transfer' | null
  parent_id: string | null
}

function getAdapter(platform: string): SyncAdapter {
  switch (platform) {
    case 'omie': return new OmieAdapter()
    case 'conta_azul': return new ContaAzulAdapter()
    case 'nibo': return new NiboAdapter()
    default: throw new Error(`Adapter não encontrado para: ${platform}`)
  }
}

export async function syncClient(
  supabase: SupabaseClient,
  clientId: string,
  platform: string
): Promise<{ count: number }> {
  // Buscar credenciais
  const { data: credRow } = await supabase
    .from('client_credentials')
    .select('credentials')
    .eq('client_id', clientId)
    .eq('platform', platform)
    .single()

  if (!credRow?.credentials) {
    throw new Error(`Credenciais não configuradas para ${platform}`)
  }

  const adapter = getAdapter(platform)
  const credentials = credRow.credentials as Record<string, string>

  const [receivables, payables] = await Promise.all([
    adapter.fetchReceivables(credentials),
    adapter.fetchPayables(credentials),
  ])

  const allEntries = [
    ...receivables.map((e) => ({ ...e, client_id: clientId, platform })),
    ...payables.map((e) => ({ ...e, client_id: clientId, platform })),
  ]

  // Upsert em lotes de 100
  let count = 0
  const BATCH_SIZE = 100
  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('financial_entries')
      .upsert(batch, { onConflict: 'client_id,platform,external_id' })
    if (error) throw new Error(error.message)
    count += batch.length
  }

  // Sincronizar categorias se suportado
  if (adapter.fetchCategories) {
    const categories = await adapter.fetchCategories(credentials)
    const catRows = categories.map((c) => ({ ...c, client_id: clientId, platform }))
    for (let i = 0; i < catRows.length; i += BATCH_SIZE) {
      await supabase
        .from('categories')
        .upsert(catRows.slice(i, i + BATCH_SIZE), { onConflict: 'client_id,platform,external_id' })
    }
  }

  // Sincronizar contas bancárias se suportado
  if (adapter.fetchBankAccounts) {
    const accounts = await adapter.fetchBankAccounts(credentials)
    const accRows = accounts.map((a) => ({ ...a, client_id: clientId, platform }))
    for (let i = 0; i < accRows.length; i += BATCH_SIZE) {
      await supabase
        .from('bank_accounts')
        .upsert(accRows.slice(i, i + BATCH_SIZE), { onConflict: 'client_id,platform,external_id' })
    }
  }

  return { count }
}
