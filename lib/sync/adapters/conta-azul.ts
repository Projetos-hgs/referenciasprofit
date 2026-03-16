import type { SyncAdapter, NormalizedEntry, NormalizedBankAccount, NormalizedCategory } from '../sync-engine'

const CONTA_AZUL_API = 'https://api.contaazul.com/v1'

function mapStatus(status: string): NormalizedEntry['status'] {
  if (status === 'PAID' || status === 'RECEIVED') return 'paid'
  if (status === 'OVERDUE') return 'overdue'
  if (status === 'CANCELLED' || status === 'CANCELED') return 'cancelled'
  return 'open'
}

async function caGet(path: string, credentials: Record<string, string>) {
  const res = await fetch(`${CONTA_AZUL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${credentials.access_token ?? credentials.client_secret}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`ContaAzul API error: ${res.status}`)
  return res.json()
}

export class ContaAzulAdapter implements SyncAdapter {
  async fetchReceivables(credentials: Record<string, string>): Promise<NormalizedEntry[]> {
    const data = await caGet('/sale/receivables?page=0&size=500', credentials)
    const items = data.content ?? data ?? []

    return items.map((item: any): NormalizedEntry => ({
      external_id: String(item.id),
      type: 'receivable',
      status: mapStatus(item.status ?? ''),
      description: item.description ?? null,
      category: item.category?.name ?? null,
      subcategory: null,
      cost_center: item.costCenter?.name ?? null,
      person_name: item.customer?.name ?? item.contact?.name ?? null,
      person_document: item.customer?.document ?? null,
      issue_date: item.emissionDate ?? null,
      due_date: item.dueDate ?? new Date().toISOString().split('T')[0],
      payment_date: item.paymentDate ?? null,
      expected_value: Number(item.amount ?? item.value ?? 0),
      paid_value: Number(item.amountPaid ?? 0),
      discount: Number(item.discount ?? 0),
      interest: Number(item.interest ?? 0),
      fine: Number(item.fine ?? 0),
      bank_account: item.bankAccount?.name ?? null,
      document_type: item.documentType ?? null,
      notes: item.notes ?? null,
      raw_data: item,
    }))
  }

  async fetchPayables(credentials: Record<string, string>): Promise<NormalizedEntry[]> {
    const data = await caGet('/purchase/payables?page=0&size=500', credentials)
    const items = data.content ?? data ?? []

    return items.map((item: any): NormalizedEntry => ({
      external_id: String(item.id),
      type: 'payable',
      status: mapStatus(item.status ?? ''),
      description: item.description ?? null,
      category: item.category?.name ?? null,
      subcategory: null,
      cost_center: item.costCenter?.name ?? null,
      person_name: item.supplier?.name ?? item.contact?.name ?? null,
      person_document: item.supplier?.document ?? null,
      issue_date: item.emissionDate ?? null,
      due_date: item.dueDate ?? new Date().toISOString().split('T')[0],
      payment_date: item.paymentDate ?? null,
      expected_value: Number(item.amount ?? item.value ?? 0),
      paid_value: Number(item.amountPaid ?? 0),
      discount: Number(item.discount ?? 0),
      interest: Number(item.interest ?? 0),
      fine: Number(item.fine ?? 0),
      bank_account: item.bankAccount?.name ?? null,
      document_type: item.documentType ?? null,
      notes: item.notes ?? null,
      raw_data: item,
    }))
  }

  async fetchCategories(credentials: Record<string, string>): Promise<NormalizedCategory[]> {
    const data = await caGet('/categories?page=0&size=500', credentials)
    const items = data.content ?? data ?? []

    return items.map((c: any) => ({
      external_id: String(c.id),
      code: c.code ?? null,
      name: c.name ?? '',
      type: c.type === 'INCOME' ? 'revenue' : c.type === 'EXPENSE' ? 'expense' : null,
      parent_id: c.parentId ? String(c.parentId) : null,
    }))
  }

  async fetchBankAccounts(credentials: Record<string, string>): Promise<NormalizedBankAccount[]> {
    const data = await caGet('/bank-accounts?page=0&size=100', credentials)
    const items = data.content ?? data ?? []

    return items.map((a: any) => ({
      external_id: String(a.id),
      name: a.name ?? '',
      bank_name: a.bank?.name ?? null,
      current_balance: Number(a.balance ?? 0),
    }))
  }
}
