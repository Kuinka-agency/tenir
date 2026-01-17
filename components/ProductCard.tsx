'use client'

import { Product } from '@/lib/products'

interface ProductCardProps {
  product: Product
  isSpinning?: boolean
}

export default function ProductCard({ product, isSpinning }: ProductCardProps) {
  return (
    <div className={`
      bg-white rounded-lg border border-neutral-200 p-4 h-full
      transition-all duration-300
      ${isSpinning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
    `}>
      {/* Image placeholder */}
      <div className="aspect-square bg-neutral-100 rounded-md mb-3 flex items-center justify-center">
        <span className="text-neutral-400 text-sm">Image</span>
      </div>

      {/* Brand */}
      {product.brand && (
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
          {product.brand}
        </p>
      )}

      {/* Name */}
      <h3 className="font-medium text-neutral-900 text-sm leading-tight mb-2 line-clamp-2">
        {product.name}
      </h3>

      {/* Popularity indicator */}
      <div className="flex items-center gap-1 text-xs text-neutral-400">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>Seen in {product.count} setups</span>
      </div>
    </div>
  )
}
