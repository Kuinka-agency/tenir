# Tenir - TODO

## Phase 1: Data Collection (Current)

### Scraping
- [x] Build scraper for workspaces.xyz
- [x] Test on 3 pages - working
- [x] Brand extraction
- [x] Category detection (20+ categories)
- [x] Co-occurrence tracking
- [x] URL fetcher from sitemap (366 workspaces found)
- [ ] **Run full scrape (~6 min)**
  ```bash
  cd /Users/eetu/claude-projects/Projects/tenir
  node scraper/extract.js --full
  ```

### After Full Scrape
- [x] Review products.json for quality
- [x] Add missing brands to KNOWN_BRANDS list (expanded to 70+ brands)
- [x] Created deduplicate.js for product normalization
- [x] Fixed brand detection order (Elgato vs LG issue)
- [x] Merged duplicate products (MX Master variants, Magic Keyboard variants, etc.)
- [ ] Fix any category misclassifications (later)
- [ ] Image analysis for aesthetic tags (later)

**Results after cleanup:**
- 772 → 689 unique products
- Unknown brands: 30 → 6
- Key duplicates merged (MX Master variants, Magic Keyboard, etc.)

## Phase 2: Stack Spinner MVP

- [ ] Set up Next.js project
- [ ] Create product database (Supabase)
- [ ] Import scraped products
- [ ] Build spin endpoint with scoring
- [ ] Build spinner UI
- [ ] Lock/re-spin functionality

## Quick Commands

```bash
# Run scraper (currently 3 pages)
node scraper/extract.js

# Check output
cat data/products-test.json | head -100
cat data/workspaces-test.json | head -100
```

## Files

- `scraper/extract.js` - Main scraper
- `data/products-test.json` - Extracted products with co-occurrence
- `data/workspaces-test.json` - Workspace data with image URLs
- `SCRAPING-PLAN.md` - Full plan details
