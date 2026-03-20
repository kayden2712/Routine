import type { ProductSize } from '@/types/customer.types'

interface SizePickerProps {
  sizes: ProductSize[]
  selectedSize?: ProductSize
  onSelect: (size: ProductSize) => void
}

export const SizePicker = ({ sizes, selectedSize, onSelect }: SizePickerProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const isSelected = selectedSize === size
        return (
          <button
            key={size}
            type="button"
            onClick={() => onSelect(size)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              isSelected
                ? 'border-white bg-white text-[#1A1A18]'
                : 'border-white/20 bg-transparent text-white/60 hover:border-white/40 hover:text-white'
            }`}
          >
            {size}
          </button>
        )
      })}
    </div>
  )
}
