'use client'

import { Product, Category } from '@/lib/products'
import ProductCard from './ProductCard'
import LockToggle from './LockToggle'

interface ProductSlotProps {
  category: Category
  product: Product | null
  isLocked: boolean
  isSpinning: boolean
  animationDelay: number
  onToggleLock: () => void
}

export default function ProductSlot({
  category,
  product,
  isLocked,
  isSpinning,
  animationDelay,
  onToggleLock,
}: ProductSlotProps) {
  return (
    <div className="flex flex-col">
      {/* Header with category name and lock toggle */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-neutral-700">
          {category.display_name}
        </h2>
        <LockToggle
          isLocked={isLocked}
          onToggle={onToggleLock}
          disabled={isSpinning}
        />
      </div>

      {/* Product card with animation */}
      <div
        className={`
          relative overflow-hidden rounded-lg
          ${isLocked ? 'ring-2 ring-neutral-900 ring-offset-2' : ''}
        `}
      >
        {product ? (
          <div
            className={isSpinning && !isLocked ? 'animate-slot-spin' : ''}
            style={{ animationDelay: `${animationDelay}ms` }}
          >
            <ProductCard product={product} isSpinning={false} />
          </div>
        ) : (
          <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
            <span className="text-neutral-400">Loading...</span>
          </div>
        )}
      </div>
    </div>
  )
}
