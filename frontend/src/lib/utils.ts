import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateBMI(weight: number, height: number) {
  return (weight / Math.pow(height / 100, 2)).toFixed(1)
}

export function getBMICategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Недостаточный вес', color: 'text-yellow-600' }
  if (bmi < 25) return { label: 'Нормальный вес', color: 'text-green-600' }
  if (bmi < 30) return { label: 'Избыточный вес', color: 'text-orange-600' }
  return { label: 'Ожирение', color: 'text-red-600' }
}

export function computeParameterStatus(
  value: number,
  normalMin: number | null,
  normalMax: number | null,
): string {
  const hasMin = normalMin !== null && normalMin !== undefined
  const hasMax = normalMax !== null && normalMax !== undefined
  if (!hasMin && !hasMax) return 'NORMAL'
  if (hasMax && value > normalMax! * 1.2) return 'CRITICAL'
  if (hasMin && value < normalMin! * 0.8) return 'CRITICAL'
  if (hasMax && value > normalMax!) return 'HIGH'
  if (hasMin && value < normalMin!) return 'LOW'
  return 'NORMAL'
}

export function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'CRITICAL': return 'text-red-700 bg-red-50 border-l-4 border-red-500'
    case 'HIGH':     return 'text-orange-700 bg-orange-50 border-l-4 border-orange-500'
    case 'LOW':      return 'text-yellow-700 bg-yellow-50 border-l-4 border-yellow-500'
    case 'NORMAL':   return 'text-green-700 bg-green-50 border border-green-200'
    default:         return 'text-slate-600 bg-slate-50 border border-slate-200'
  }
}

export function getStatusLabel(status: string) {
  switch (status?.toUpperCase()) {
    case 'CRITICAL': return '⚠ Критично'
    case 'HIGH':     return '↑ Выше нормы'
    case 'LOW':      return '↓ Ниже нормы'
    case 'NORMAL':   return '✓ Норма'
    default:         return status
  }
}
