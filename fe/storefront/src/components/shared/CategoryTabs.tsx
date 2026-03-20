import type { ProductCategory } from '@/types/customer.types'

interface CategoryTabsProps {
  categories: ProductCategory[]
  activeCategory: ProductCategory | 'all'
  onCategoryChange: (category: ProductCategory | 'all') => void
}

export const CategoryTabs = ({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onCategoryChange('all')}
        className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.1em] transition ${
          activeCategory === 'all'
            ? 'border-white bg-white text-[#1A1A18]'
            : 'border-white/35 bg-transparent text-white/75 hover:border-white/60 hover:text-white'
        }`}
      >
        Tất cả
      </button>

      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.1em] transition ${
            activeCategory === category
              ? 'border-white bg-white text-[#1A1A18]'
              : 'border-white/35 bg-transparent text-white/75 hover:border-white/60 hover:text-white'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
