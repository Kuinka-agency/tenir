'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product, Category } from '@/lib/products'
import ProductSlot from './ProductSlot'

interface SpinResponse {
  products: Record<string, Product>
  categories: Category[]
}

export default function SpinnerMachine() {
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [locked, setLocked] = useState<Record<string, number>>({})
  const [isSpinning, setIsSpinning] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const spin = useCallback(async () => {
    setIsSpinning(true)

    // Build locked parameter
    const lockedParam = Object.entries(locked)
      .map(([category, id]) => `${category}:${id}`)
      .join(',')

    const url = lockedParam
      ? `/api/spin?locked=${encodeURIComponent(lockedParam)}`
      : '/api/spin'

    try {
      const res = await fetch(url)
      const data: SpinResponse = await res.json()

      // Small delay to let animation play
      setTimeout(() => {
        setProducts(data.products)
        setCategories(data.categories)
        setIsSpinning(false)
        setIsLoaded(true)
      }, 400)
    } catch (error) {
      console.error('Spin failed:', error)
      setIsSpinning(false)
    }
  }, [locked])

  // Initial spin on mount
  useEffect(() => {
    spin()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLock = (category: string) => {
    const product = products[category]
    if (!product) return

    setLocked(prev => {
      if (prev[category]) {
        const { [category]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [category]: product.id }
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Stack Spinner
        </h1>
        <p className="text-neutral-600">
          Spin to discover your perfect desk setup
        </p>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {categories.map((category, index) => (
          <ProductSlot
            key={category.name}
            category={category}
            product={products[category.name] || null}
            isLocked={!!locked[category.name]}
            isSpinning={isSpinning}
            animationDelay={index * 100}
            onToggleLock={() => toggleLock(category.name)}
          />
        ))}
      </div>

      {/* Spin Button */}
      <div className="text-center">
        <button
          onClick={spin}
          disabled={isSpinning}
          className={`
            px-8 py-4 text-lg font-semibold rounded-full
            transition-all duration-200 transform
            ${isSpinning
              ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-105 active:scale-95'
            }
          `}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Spinning...
            </span>
          ) : (
            'Spin'
          )}
        </button>

        {/* Lock hint */}
        {isLoaded && Object.keys(locked).length === 0 && (
          <p className="mt-4 text-sm text-neutral-500">
            Tip: Lock products you like to keep them on re-spin
          </p>
        )}

        {Object.keys(locked).length > 0 && (
          <p className="mt-4 text-sm text-neutral-500">
            {Object.keys(locked).length} slot{Object.keys(locked).length > 1 ? 's' : ''} locked
          </p>
        )}
      </div>
    </div>
  )
}
