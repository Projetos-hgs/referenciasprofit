import type { SyncAdapter, NormalizedEntry, NormalizedBankAccount, NormalizedCategory } from '../sync-engine'

const OMIE_API = 'https://app.omie.com.br/api/v1'

type OmieStatus = 'RECEBIDO' | 'VENCIDO' | 'A_VENCER' | 'CANCELADO'

function mapStatus(status: OmieStatus, type: 'receivable' | 'payable'): NormalizedEntry['status'] {
  if (status === 'RECEBIDO') return 'paid'
  if (status === 'CANCELADO') return 'cancelled'
  if (status === 'VENCIDO') return 'overdue'
  return 'open'
}

function parseDate(d: string | null | undefined): string | null {
  if (!d) return null
  const [day, month, year] = d.split('/')
  if (!day || !month || !year) return null
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

async function omieCall(endpoint: string, call: string, param: Record<string, unknown>, credentials: Record<string, string>) {
  const body = {
    call,
    app_key: credentials.app_key,
    app_secret: credentials.app_secret,
    param: [param],
  }
  const res = await fetch(`${OMIE_API}/${endpoint}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Omie API error: ${res.status}`)
  return res.json()
}

export class OmieAdapter implements SyncAdapter {
  async fetchReceivables(credentials: Record<string, string>): Promise<NormalizedEntry[]> {
    const entries: NormalizedEntry[] = []
    let page = 1
    const pageSize = 50

    while (true) {
      const data = await omieCall('financas/contareceber', 'ListarContasReceber', {
        pagina: page,
        registros_por_pagina: pageSize,
        apenas_importado_api: 'N',
      }, credentials)

      const items = data.conta_receber_cadastro ?? []
      if (!items.length) break

      for (const item of items) {
        entries.push({
          external_id: String(item.codigo_lancamento_omie ?? item.codigo_lancamento_integracao),
          type: 'receivable',
          status: mapStatus(item.status_titulo, 'receivable'),
          description: item.observacao ?? null,
          category: item.codigo_categoria ?? null,
          subcategory: null,
          cost_center: item.codigo_centro_custo?.codigo_centro_custo ?? null,
          person_name: item.nome_cliente ?? null,
          person_document: item.documento_cliente ?? null,
          issue_date: parseDate(item.data_emissao),
          due_date: parseDate(item.data_vencimento) ?? new Date().toISOString().split('T')[0],
          payment_date: parseDate(item.data_pagamento),
          expected_value: Number(item.valor_documento ?? 0),
          paid_value: Number(item.valor_recebido ?? 0),
          discount: Number(item.valor_desconto ?? 0),
          interest: Number(item.valor_juros ?? 0),
          fine: Number(item.valor_multa ?? 0),
          bank_account: item.codigo_conta_corrente ?? null,
          document_type: item.codigo_tipo_documento ?? null,
          notes: item.observacao ?? null,
          raw_data: item,
        })
      }

      if (data.total_de_paginas <= page) break
      page++
    }

    return entries
  }

  async fetchPayables(credentials: Record<string, string>): Promise<NormalizedEntry[]> {
    const entries: NormalizedEntry[] = []
    let page = 1
    const pageSize = 50

    while (true) {
      const data = await omieCall('financas/contapagar', 'ListarContasPagar', {
        pagina: page,
        registros_por_pagina: pageSize,
        apenas_importado_api: 'N',
      }, credentials)

      const items = data.conta_pagar_cadastro ?? []
      if (!items.length) break

      for (const item of items) {
        entries.push({
          external_id: String(item.codigo_lancamento_omie ?? item.codigo_lancamento_integracao),
          type: 'payable',
          status: mapStatus(item.status_titulo, 'payable'),
          description: item.observacao ?? null,
          category: item.codigo_categoria ?? null,
          subcategory: null,
          cost_center: item.codigo_centro_custo?.codigo_centro_custo ?? null,
          person_name: item.nome_fornecedor ?? null,
          person_document: item.documento_fornecedor ?? null,
          issue_date: parseDate(item.data_emissao),
          due_date: parseDate(item.data_vencimento) ?? new Date().toISOString().split('T')[0],
          payment_date: parseDate(item.data_pagamento),
          expected_value: Number(item.valor_documento ?? 0),
          paid_value: Number(item.valor_pago ?? 0),
          discount: Number(item.valor_desconto ?? 0),
          interest: Number(item.valor_juros ?? 0),
          fine: Number(item.valor_multa ?? 0),
          bank_account: item.codigo_conta_corrente ?? null,
          document_type: item.codigo_tipo_documento ?? null,
          notes: item.observacao ?? null,
          raw_data: item,
        })
      }

      if (data.total_de_paginas <= page) break
      page++
    }

    return entries
  }

  async fetchCategories(credentials: Record<string, string>): Promise<NormalizedCategory[]> {
    const data = await omieCall('geral/categorias', 'ListarCategorias', {
      pagina: 1,
      registros_por_pagina: 500,
    }, credentials)

    return (data.categoria_cadastro ?? []).map((c: any) => ({
      external_id: String(c.codigo),
      code: c.codigo ?? null,
      name: c.descricao ?? '',
      type: c.tipo === 'R' ? 'revenue' : c.tipo === 'D' ? 'expense' : null,
      parent_id: null,
    }))
  }

  async fetchBankAccounts(credentials: Record<string, string>): Promise<NormalizedBankAccount[]> {
    const data = await omieCall('geral/contacorrente', 'ListarContasCorrentes', {
      pagina: 1,
      registros_por_pagina: 100,
    }, credentials)

    return (data.ListarContasCorrentes ?? []).map((a: any) => ({
      external_id: String(a.nCodCC),
      name: a.descricao ?? '',
      bank_name: a.cBanco ?? null,
      current_balance: Number(a.nSaldoAtu ?? 0),
    }))
  }
}
