import type { ProductBadge } from '@/types/customer.types'

interface BadgeProps {
  value?: ProductBadge
}

const styleMap: Record<ProductBadge, string> = {
  new: 'border border-[var(--line)] bg-white text-[#1A1A18]',
  sale: 'border border-[#B91C1C] bg-[#DC2626] text-white shadow-[0_4px_12px_rgba(220,38,38,0.35)]',
  bestseller: 'border border-[#92400E] bg-[#B45309] text-white',
}

const labelMap: Record<ProductBadge, string> = {
  new: 'NEW',
  sale: 'SALE',
  bestseller: 'BESTSELLER',
}

export const Badge = ({ value }: BadgeProps) => {
  if (!value) {
    return null
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] ${styleMap[value]}`}>
      {labelMap[value]}
    </span>
  )
}
