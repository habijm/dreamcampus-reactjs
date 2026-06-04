import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num)
}

export function getAccreditationColor(accreditation) {
  const colors = {
    'A': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'B': 'bg-blue-100 text-blue-800 border-blue-200',
    'C': 'bg-amber-100 text-amber-800 border-amber-200',
    'Unggul': 'bg-purple-100 text-purple-800 border-purple-200',
    'Baik Sekali': 'bg-blue-100 text-blue-800 border-blue-200',
    'Baik': 'bg-green-100 text-green-800 border-green-200',
  }
  return colors[accreditation] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export function getScoreColor(score) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-500'
}

export function getScoreBg(score) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export function truncate(str, n) {
  return str?.length > n ? str.substr(0, n - 1) + '...' : str
}
