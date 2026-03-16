import type { SyncAdapter, NormalizedEntry, NormalizedBankAccount, NormalizedCategory } from '../sync-engine'

const NIBO_API = 'https://api.nibo.com.br/empresas/v1'

function mapStatus(situation: string): NormalizedEntry['status'] {
  if (situation === 'Liquidated' || situation === 'liquidated') return 'paid'
  if (situation === 'Overdue' || situation === 'overdue') return 'overdue'
  if (situation === 'Cancelled' || situation === 'cancelled') return 'cancelled'
  return 'open'
}

async function niboGet(path: string, credentials: Record<string, string>) {
  const res = await fetch(`${NIBO_API}${path}`, {
    headers: {
      apitoken: credentials.api_token,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Nibo API error: ${res.status} ${await res.text()}`)
  return res.json()
}

export class NiboAdapter implements SyncAdapter {
  async fetchReceivables(credentials: Record<string, string>): Promise<NormalizedEntry[]> {
    const data = await niboGet('/schedules/receivables?pageSize=500&pageIndex=1', credentials)
    const items = data.items ?? data ?? []

    return items.map((item: any): NormalizedEntry => ({
      external_id: String(item.scheduleId ?? item.id),
      type: 'receivable',
      status: mapStatus(item.situation ?? ''),
      description: item.description ?? null,
      category: item.category?.name ?? item.categoryName ?? null,
      subcategory: item.subCategory?.name ?? null,
      cost_center: item.costCenter?.name ?? null,
      person_name: item.stakeholder?.name ?? item.customerName ?? null,
      person_document: item.stakeholder?.govCode ?? null,
      issue_date: item.competenceDate ?? null,
      due_date: item.dueDate ?? new Date().toISOString().split('T')[0],
      payment_date: item.liquidationDate ?? null,
      expected_value: Number(item.value ?? item.amount ?? 0),
      paid_value: Number(item.liquidationValue ?? item.amountPaid ?? 0),
      discount: Number(item.discountValue ?? 0),
      interest: Number(item.interestValue ?? 0),
      fine: Number(item.fineValue ?? 0),
      bank_account: item.account?.name ?? null,
      document_type: item.documentType ?? null,
      notes: item.notes ?? null,
      raw_data: item,
    }))
  }

  async fetchPayables(credentials: Record<string, string>): Promise<NormalizedEntry[]> {
    const data = await niboGet('/schedules/payables?pageSize=500&pageIndex=1', credentials)
    const items = data.items ?? data ?? []

    return items.map((item: any): NormalizedEntry => ({
      external_id: String(item.scheduleId ?? item.id),
      type: 'payable',
      status: mapStatus(item.situation ?? ''),
      description: item.description ?? null,
      category: item.category?.name ?? item.categoryName ?? null,
      subcategory: item.subCategory?.name ?? null,
      cost_center: item.costCenter?.name ?? null,
      person_name: item.stakeholder?.name ?? item.supplierName ?? null,
      person_document: item.stakeholder?.govCode ?? null,
      issue_date: item.competenceDate ?? null,
      due_date: item.dueDate ?? new Date().toISOString().split('T')[0],
      payment_date: item.liquidationDate ?? null,
      expected_value: Number(item.value ?? item.amount ?? 0),
      paid_value: Number(item.liquidationValue ?? item.amountPaid ?? 0),
      discount: Number(item.discountValue ?? 0),
      interest: Number(item.interestValue ?? 0),
      fine: Number(item.fineValue ?? 0),
      bank_account: item.account?.name ?? null,
      document_type: item.documentType ?? null,
      notes: item.notes ?? null,
      raw_data: item,
    }))
  }

  async fetchCategories(credentials: Record<string, string>): Promise<NormalizedCategory[]> {
    const data = await niboGet('/categories?pageSize=500&pageIndex=1', credentials)
    const items = data.items ?? data ?? []

    return items.map((c: any) => ({
      external_id: String(c.categoryId ?? c.id),
      code: c.code ?? null,
      name: c.name ?? '',
      type: c.type === 'Revenue' ? 'revenue' : c.type === 'Expense' ? 'expense' : null,
      parent_id: null,
    }))
  }

  async fetchBankAccounts(credentials: Record<string, string>): Promise<NormalizedBankAccount[]> {
    const data = await niboGet('/accounts?pageSize=100&pageIndex=1', credentials)
    const items = data.items ?? data ?? []

    return items.map((a: any) => ({
      external_id: String(a.accountId ?? a.id),
      name: a.name ?? '',
      bank_name: a.bank?.name ?? null,
      current_balance: Number(a.currentBalance ?? a.balance ?? 0),
    }))
  }
}
