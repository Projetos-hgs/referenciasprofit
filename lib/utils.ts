// Utilitários — BPO Financeiro
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '-'
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    omie: 'Omie',
    conta_azul: 'ContaAzul',
    nibo: 'Nibo',
  }
  return labels[platform] ?? platform
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    omie: '#0055FF',
    conta_azul: '#00B1CC',
    nibo: '#FF6B00',
  }
  return colors[platform] ?? '#6c2894'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: 'Em Aberto',
    paid: 'Pago',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
  }
  return labels[status] ?? status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'text-info',
    paid: 'text-success',
    overdue: 'text-danger',
    cancelled: 'text-muted-foreground',
  }
  return colors[status] ?? 'text-foreground'
}

export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-info/10 text-info',
    paid: 'bg-success/10 text-success',
    overdue: 'bg-danger/10 text-danger',
    cancelled: 'bg-muted/20 text-muted-foreground',
  }
  return colors[status] ?? 'bg-muted/20 text-muted-foreground'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getMonthLabel(month: number): string {
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return labels[month - 1] ?? String(month)
}
