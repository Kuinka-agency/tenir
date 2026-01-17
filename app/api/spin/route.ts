import { NextRequest, NextResponse } from 'next/server'
import { spinProducts, getCategories } from '@/lib/products'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lockedParam = searchParams.get('locked')

  // Parse locked products: "keyboard:123,mouse:456"
  const locked: Record<string, number> = {}

  if (lockedParam) {
    const pairs = lockedParam.split(',')
    for (const pair of pairs) {
      const [category, id] = pair.split(':')
      if (category && id) {
        locked[category] = parseInt(id, 10)
      }
    }
  }

  const products = spinProducts(locked)
  const categories = getCategories()

  return NextResponse.json({
    products,
    categories,
  })
}
