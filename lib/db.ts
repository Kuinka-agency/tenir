import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'spinner.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  }
  return db
}

export function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      slot_position INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      description TEXT,
      url TEXT,
      category TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      workspaces TEXT,
      often_with TEXT,
      FOREIGN KEY (category) REFERENCES categories(name)
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_count ON products(count DESC);
  `)

  // Insert default spinner categories
  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (name, display_name, slot_position)
    VALUES (?, ?, ?)
  `)

  const categories = [
    ['monitor', 'Monitor', 1],
    ['keyboard', 'Keyboard', 2],
    ['mouse', 'Mouse', 3],
    ['chair', 'Chair', 4],
    ['desk', 'Desk', 5],
    ['headphones', 'Audio', 6],
  ]

  for (const [name, displayName, position] of categories) {
    insertCategory.run(name, displayName, position)
  }

  return db
}
