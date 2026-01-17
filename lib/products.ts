import { getDb } from './db'

export interface Product {
  id: number
  name: string
  brand: string | null
  model: string | null
  description: string | null
  url: string | null
  category: string
  count: number
  workspaces: string[]
  oftenWith: { product: string; count: number }[]
}

export interface Category {
  id: number
  name: string
  display_name: string
  slot_position: number
}

export function getCategories(): Category[] {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM categories ORDER BY slot_position
  `).all() as Category[]
}

export function getProductsByCategory(category: string): Product[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM products WHERE category = ? ORDER BY count DESC
  `).all(category) as any[]

  return rows.map(row => ({
    ...row,
    workspaces: row.workspaces ? JSON.parse(row.workspaces) : [],
    oftenWith: row.often_with ? JSON.parse(row.often_with) : [],
  }))
}

export function getRandomProduct(category: string, excludeIds: number[] = []): Product | null {
  const db = getDb()

  // Get all products in category with their counts (popularity)
  let query = `SELECT * FROM products WHERE category = ?`
  const params: any[] = [category]

  if (excludeIds.length > 0) {
    query += ` AND id NOT IN (${excludeIds.map(() => '?').join(',')})`
    params.push(...excludeIds)
  }

  const products = db.prepare(query).all(...params) as any[]

  if (products.length === 0) return null

  // Weighted random selection based on popularity (count)
  const totalWeight = products.reduce((sum, p) => sum + Math.max(p.count, 1), 0)
  let random = Math.random() * totalWeight

  for (const product of products) {
    random -= Math.max(product.count, 1)
    if (random <= 0) {
      return {
        ...product,
        workspaces: product.workspaces ? JSON.parse(product.workspaces) : [],
        oftenWith: product.often_with ? JSON.parse(product.often_with) : [],
      }
    }
  }

  // Fallback to first product
  const product = products[0]
  return {
    ...product,
    workspaces: product.workspaces ? JSON.parse(product.workspaces) : [],
    oftenWith: product.often_with ? JSON.parse(product.often_with) : [],
  }
}

export function getProductById(id: number): Product | null {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as any

  if (!row) return null

  return {
    ...row,
    workspaces: row.workspaces ? JSON.parse(row.workspaces) : [],
    oftenWith: row.often_with ? JSON.parse(row.often_with) : [],
  }
}

export interface SpinResult {
  [category: string]: Product
}

export function spinProducts(locked: Record<string, number> = {}): SpinResult {
  const categories = getCategories()
  const result: SpinResult = {}

  for (const cat of categories) {
    if (locked[cat.name]) {
      // Keep the locked product
      const product = getProductById(locked[cat.name])
      if (product) {
        result[cat.name] = product
        continue
      }
    }

    // Get random product for this category
    const product = getRandomProduct(cat.name)
    if (product) {
      result[cat.name] = product
    }
  }

  return result
}
