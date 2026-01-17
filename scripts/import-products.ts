import { readFileSync } from 'fs'
import path from 'path'
import { initDb, getDb } from '../lib/db'

interface RawProduct {
  name: string
  brand: string
  model: string
  description: string
  url: string
  category: string
  count: number
  workspaces: string[]
  oftenWith: { product: string; count: number }[]
}

const SPINNER_CATEGORIES = ['monitor', 'keyboard', 'mouse', 'chair', 'desk', 'headphones']

async function main() {
  console.log('Initializing database...')
  initDb()

  const db = getDb()

  // Clear existing products
  db.exec('DELETE FROM products')

  // Read products from JSON
  const jsonPath = path.join(process.cwd(), 'data', 'products-clean.json')
  const rawData = readFileSync(jsonPath, 'utf-8')
  const products: RawProduct[] = JSON.parse(rawData)

  console.log(`Found ${products.length} total products`)

  // Filter to spinner categories only
  const spinnerProducts = products.filter(p => SPINNER_CATEGORIES.includes(p.category))
  console.log(`Filtering to ${spinnerProducts.length} products in spinner categories`)

  // Insert products
  const insertProduct = db.prepare(`
    INSERT INTO products (name, brand, model, description, url, category, count, workspaces, often_with)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMany = db.transaction((products: RawProduct[]) => {
    for (const p of products) {
      insertProduct.run(
        p.name,
        p.brand || null,
        p.model || null,
        p.description || null,
        p.url || null,
        p.category,
        p.count || 1,
        JSON.stringify(p.workspaces || []),
        JSON.stringify(p.oftenWith || [])
      )
    }
  })

  insertMany(spinnerProducts)

  // Show stats
  const stats = db.prepare(`
    SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC
  `).all() as { category: string; count: number }[]

  console.log('\nImported products by category:')
  for (const stat of stats) {
    console.log(`  ${stat.category}: ${stat.count}`)
  }

  console.log('\nImport complete!')
}

main().catch(console.error)
