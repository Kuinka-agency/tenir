# Tenir: Workspaces.xyz Scraping Plan

## Current Status: READY FOR FULL SCRAPE

**Completed:**
- [x] Explored workspaces.xyz structure (~515 workspace profiles)
- [x] Built scraper with cheerio/node-fetch
- [x] Tested on 3 pages - working
- [x] Brand extraction (40+ known brands)
- [x] Improved category detection (20+ categories)
- [x] Co-occurrence tracking (products that appear together)

**Next step:** Run full scrape of all 515 workspaces (~9 min)

---

## Objective
Scrape workspaces.xyz to build initial product catalog and aesthetic reference for the Stack Spinner MVP.

## Source Analysis

**Site Structure:**
- ~515 workspace profiles at `/p/{number}-{name}`
- Category pages (Standing Desk, Minimal, Apple, etc.)
- Gift guide with curated product picks

**Per Workspace Page:**
- 5-10 high-quality workspace images
- Person info (name, role, location)
- Products organized by category (Desk, Accessories, Display, Audio, etc.)
- Product format: `[Product Name](affiliate_link) – description`
- Interview Q&A content with setup philosophy

## Data to Extract

### 1. Products
```
- name: "Apple Studio Display"
- brand: "Apple" (parsed from name)
- category: "Display, Seating & Audio"
- description: "27″ 5K display for design and video work"
- source_url: affiliate link (for reference only)
- workspace_count: how many times it appears
- workspace_contexts: array of workspace IDs where it appears
```

### 2. Images
```
- image_url: direct URL
- workspace_id: source workspace
- workspace_name: person name
- workspace_vibe: tags/categories if available
```

### 3. Workspace Context
```
- id: "515-jorge-powell"
- name: "Jorge Powell"
- role: "Content Creator"
- location: "UK"
- categories: ["Standing Desk", "Apple Setup"]
- interview_highlights: key quotes about setup choices
```

## Technical Approach

### Option A: Firecrawl (Recommended)
Use the `firecrawl-research` skill to crawl and extract structured data.

**Pros:**
- Built-in rate limiting and politeness
- Handles pagination automatically
- Returns markdown for easy parsing

**Cons:**
- May need multiple crawl passes
- Cost per page

### Option B: Custom Playwright Scraper
Build a scraper using the browser MCP tools.

**Pros:**
- Full control over extraction logic
- Can handle dynamic content
- Free

**Cons:**
- More development time
- Need to handle rate limiting ourselves

### Recommendation: Hybrid Approach
1. Use Firecrawl to get the sitemap/page list
2. Use custom Playwright script for detailed extraction with structured output

## Output Format

### products.json
```json
{
  "products": [
    {
      "id": "apple-studio-display",
      "name": "Apple Studio Display",
      "brand": "Apple",
      "category": "display",
      "normalized_category": "monitor",
      "description": "27″ 5K display for design and video work",
      "appearances": 87,
      "sample_contexts": ["472-luke-netti", "515-jorge-powell"]
    }
  ]
}
```

### workspaces.json
```json
{
  "workspaces": [
    {
      "id": "515-jorge-powell",
      "name": "Jorge Powell",
      "role": "Content Creator",
      "location": "UK",
      "categories": ["standing-desk", "apple-setup"],
      "products": ["apple-studio-display", "herman-miller-aeron", ...],
      "images": ["url1", "url2", ...],
      "interview_highlights": [
        "Invest in quality ergonomic solutions...",
        "Natural light plays fundamental role..."
      ]
    }
  ]
}
```

### Image URLs
Stored within workspaces.json - no local download needed.

## Category Mapping

Map extracted categories to Tenir categories:

| Workspaces.xyz Category | Tenir Category |
|-------------------------|----------------|
| Desk & Workspace Furniture | desk |
| Desk Accessories & Organization | accessory |
| Display, Seating & Audio | display, chair, speaker |
| Audio, Video & Connectivity | audio, dock |
| Misc Items | peripheral |
| Software & Workflow Tools | (skip - not hardware) |

## Implementation Steps

### Step 1: Setup Project Structure
```
tenir/
├── scraper/
│   ├── fetch_urls.ts       # Get all workspace URLs
│   ├── extract.ts          # Main extraction logic
│   └── deduplicate.ts      # Product fuzzy matching
├── data/
│   ├── raw/                # Raw scraped JSON per workspace
│   ├── products.json       # Processed & deduplicated products
│   └── workspaces.json     # All workspace data with image URLs
├── package.json
└── README.md
```

### Step 2: Fetch All Workspace URLs (~515)
- Scrape /setups page with "Load more" pagination
- Or parse sitemap.xml for /p/ URLs
- Save URL list to `data/urls.json`

### Step 3: Extract Workspace Data
For each workspace URL:
- Person info (name, role, location)
- Product lists by category with descriptions
- All image URLs (store, don't download)
- Interview Q&A highlights
- Rate limit: 1 request per second
- Save raw JSON per workspace in `data/raw/`

### Step 4: Deduplicate Products (Fuzzy Matching)
- Aggregate all products across workspaces
- Fuzzy match similar names (Levenshtein + brand normalization)
- Merge "MX Master 3S" with "MX Master 3S for Mac"
- Count total appearances
- Map to Tenir categories

### Step 5: Generate Output Files
- `products.json`: Deduplicated product catalog with frequency
- `workspaces.json`: All workspaces with image URLs and products
- Console summary: top products, category distribution

## Ethical Considerations

- Respect robots.txt (if present)
- Rate limit requests (1-2/sec)
- Use data only for initial catalog bootstrapping
- Don't copy their editorial content verbatim
- Don't use their images in production

## Estimated Scope

- ~515 workspace pages to scrape
- ~50-100 products per workspace (with overlap)
- Estimate 500-1000 unique products after deduplication
- ~3000-5000 image URLs stored
- Runtime: ~10-15 minutes at 1 req/sec

## Verification

After scraping completes:
1. Check `products.json` has 500+ unique products
2. Check `workspaces.json` has ~515 entries
3. Verify top products match expected (Apple Studio Display, MX Master, Herman Miller Aeron)
4. Spot-check 3 random workspaces have correct product lists
5. Verify image URLs are valid (sample 10)

## Decisions

- **Scrape depth**: All ~515 workspaces for complete dataset
- **Images**: Store URLs only (no local download)
- **Deduplication**: Fuzzy matching to consolidate variants
