// Tipos globais — BPO Financeiro

export type Platform = 'omie' | 'conta_azul' | 'nibo'
export type UserRole = 'admin' | 'analyst' | 'viewer'
export type EntryType = 'receivable' | 'payable'
export type EntryStatus = 'open' | 'paid' | 'overdue' | 'cancelled'
export type DreLineType = 'revenue' | 'deduction' | 'cost' | 'expense' | 'subtotal' | 'total'
export type SyncStatus = 'running' | 'completed' | 'failed'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
}

export interface User {
  id: string
  organization_id: string | null
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Client {
  id: string
  organization_id: string
  name: string
  cnpj: string | null
  platform: Platform
  logo_url: string | null
  color: string
  is_active: boolean
  created_at: string
}

export interface ClientCredential {
  id: string
  client_id: string
  platform: Platform
  credentials: Record<string, string>
  token_expires_at: string | null
  last_sync_at: string | null
  created_at: string
}

export interface FinancialEntry {
  id: string
  client_id: string
  platform: Platform
  external_id: string | null
  type: EntryType
  status: EntryStatus
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
  raw_data: Record<string, unknown> | null
  synced_at: string
  created_at: string
}

export interface BankAccount {
  id: string
  client_id: string
  platform: Platform
  external_id: string | null
  name: string
  bank_name: string | null
  current_balance: number
  last_sync_at: string | null
  created_at: string
}

export interface Category {
  id: string
  client_id: string
  platform: Platform
  external_id: string | null
  code: string | null
  name: string
  type: 'revenue' | 'expense' | 'transfer' | null
  parent_id: string | null
  created_at: string
}

export interface SyncLog {
  id: string
  client_id: string
  platform: Platform
  sync_type: string
  status: SyncStatus
  records_synced: number
  error_message: string | null
  started_at: string
  finished_at: string | null
}

export interface DreConfig {
  id: string
  client_id: string
  line_order: number
  line_label: string
  line_type: DreLineType
  category_codes: string[] | null
  formula: string | null
  is_bold: boolean
  created_at: string
}

// KPIs summary
export interface FinancialSummary {
  totalReceivable: number
  totalPayable: number
  overdueReceivable: number
  overduePayable: number
  cashBalance: number
  netResult: number
}

// DRE row
export interface DreRow {
  label: string
  type: DreLineType
  isBold: boolean
  values: Record<string, number> // mês -> valor
  total: number
}
