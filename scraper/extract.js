const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { fetchWorkspaceUrls } = require('./fetch_urls');

// Configuration
const FULL_SCRAPE = process.argv.includes('--full');
const TEST_LIMIT = 3;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getUrls() {
  const urlsPath = path.join(__dirname, '../data/urls.json');

  // Check if we have cached URLs
  if (fs.existsSync(urlsPath)) {
    const data = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));
    console.log(`Using cached URLs (${data.count} total, fetched ${data.fetchedAt})`);
    return data.urls;
  }

  // Fetch fresh URLs
  console.log('No cached URLs found, fetching from sitemap...');
  return await fetchWorkspaceUrls();
}

async function extractWorkspace(url) {
  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    console.error(`Failed to fetch ${url}: ${response.status}`);
    return null;
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract workspace ID from URL
  const id = url.split('/p/')[1];

  // Extract person info
  const name = $('h1').first().text().trim();
  const roleText = $('h1').first().parent().find('p').first().text().trim();

  // Extract images
  const images = [];
  $('img').each((i, el) => {
    const src = $(el).attr('src');
    if (src && src.includes('media.beehiiv.com') && !src.includes('logo')) {
      images.push(src);
    }
  });

  // Extract products by category
  const products = [];
  let currentCategory = 'Uncategorized';

  // Find all h3 (category headers) and lists
  $('h2, h3').each((i, el) => {
    const headerText = $(el).text().trim();

    // Check if this is a category header
    if (headerText.includes('Desk') || headerText.includes('Display') ||
        headerText.includes('Audio') || headerText.includes('Accessories') ||
        headerText.includes('Hardware') || headerText.includes('Misc') ||
        headerText.includes('Software')) {
      currentCategory = headerText;
    }
  });

  // Extract product links
  $('li').each((i, el) => {
    const $li = $(el);
    const $link = $li.find('a').first();

    if ($link.length) {
      const productName = $link.text().trim();
      const productUrl = $link.attr('href');
      const fullText = $li.text().trim();

      // Extract description (text after the link)
      const description = fullText.replace(productName, '').replace(/^[\s–-]+/, '').trim();

      // Skip non-product links
      if (productUrl && (productUrl.includes('amzn.to') || productUrl.includes('awin') ||
          productUrl.includes('grovemade') || productUrl.includes('oakywood') ||
          productUrl.includes('store.') || productUrl.includes('?utm'))) {

        const { brand, model } = extractBrand(productName);

        products.push({
          name: productName,
          brand,
          model,
          description: description,
          url: productUrl,
          category: guessCategory(productName, description)
        });
      }
    }
  });

  // Extract interview Q&A highlights
  const highlights = [];
  $('h2').each((i, el) => {
    const question = $(el).text().trim();
    if (question.includes('?')) {
      const answer = $(el).next().text().trim();
      if (answer && answer.length > 50) {
        highlights.push({
          question: question.substring(0, 100),
          answer: answer.substring(0, 300)
        });
      }
    }
  });

  return {
    id,
    name,
    role: roleText,
    url,
    images: [...new Set(images)], // Dedupe
    products,
    highlights: highlights.slice(0, 3), // Top 3 Q&As
    scrapedAt: new Date().toISOString()
  };
}

// Known brands for extraction (order matters - longer/more specific first)
// IMPORTANT: Longer brand names must come before shorter ones that are substrings
// e.g., "Elgato" before "LG" (elgato contains lg)
const KNOWN_BRANDS = [
  // Video & Streaming (Elgato before LG!)
  'Elgato', 'Insta360', 'GoPro', 'Canon', 'Nikon', 'Fujifilm', 'Blackmagic',
  'amaran', 'Aputure', 'Neewer', 'Godox', 'Lume Cube',

  // Computers & Displays
  'Apple', 'Microsoft', 'Samsung', 'Dell', 'ASUS', 'Acer', 'Lenovo',
  'BenQ', 'ViewSonic', 'AOC', 'Philips', 'MSI', 'HP', 'LG',

  // Input devices
  'Logitech', 'Logi', 'Razer', 'SteelSeries', 'Corsair', 'HyperX',
  'Keychron', 'NuPhy', 'HHKB', 'Ducky', 'Varmilo', 'Leopold', 'Topre',
  'Glorious', 'Das Keyboard', 'Kinesis', 'ZSA', 'Moonlander',

  // Audio (Audio-Technica before just "Audio")
  'Audio-Technica', 'Audioengine',
  'Rode', 'RØDE', 'Shure', 'Blue', 'Sennheiser', 'Beyerdynamic',
  'Focusrite', 'Scarlett', 'Universal Audio', 'PreSonus',
  'Kanto', 'Sonos', 'Bose', 'JBL', 'Klipsch', 'Edifier',
  'iLoud', 'IK Multimedia',

  // Furniture
  'Herman Miller', 'Steelcase', 'Humanscale', 'Haworth', 'Secretlab',
  'Autonomous', 'Uplift', 'Fully', 'Jarvis', 'Vari', 'FlexiSpot', 'Vernal',
  'IKEA', 'Branch', 'Ergotron',

  // Desk accessories (Twelve South before just "South")
  'Twelve South', 'TwelveSouth',
  'Oakywood', 'Grovemade', 'Ugmonk', 'Orbitkey', 'Bellroy',
  'Rain Design', 'Satechi', 'Moft',

  // Connectivity & Power
  'CalDigit', 'OWC', 'Anker', 'Belkin', 'Native Union', 'Nomad',

  // Misc tech
  'Dyson', 'Xiaomi', 'Teenage Engineering', 'Kindle', 'Amazon',
  'Avantree', 'Jabra', 'Poly', 'Plantronics',

  // Chairs (specific models that are brands)
  'Aeron', 'Embody', 'Mirra', 'Leap', 'Gesture',
];

function extractBrand(productName) {
  const nameLower = productName.toLowerCase();

  for (const brand of KNOWN_BRANDS) {
    if (nameLower.includes(brand.toLowerCase())) {
      // Extract the model name (everything after the brand)
      const brandIndex = nameLower.indexOf(brand.toLowerCase());
      const model = productName.substring(brandIndex + brand.length).trim().replace(/^[-–]\s*/, '');
      return { brand, model: model || productName };
    }
  }

  // Try to extract brand from first word if it looks like a brand (capitalized)
  const words = productName.split(' ');
  if (words.length > 1 && /^[A-Z]/.test(words[0])) {
    return { brand: words[0], model: words.slice(1).join(' ') };
  }

  return { brand: 'Unknown', model: productName };
}

function guessCategory(name, description) {
  const text = (name + ' ' + description).toLowerCase();

  // Order matters - more specific matches first

  // Microphones (check before "stand" to avoid mic stands being categorized wrong)
  if (text.includes('microphone') || text.includes('mic arm') ||
      (text.includes('røde') && !text.includes('caster')) ||
      (text.includes('rode') && !text.includes('caster')) ||
      text.includes('shure') && (text.includes('sm') || text.includes('mv'))) return 'microphone';

  // Stands and mounts (specific types)
  if (text.includes('laptop stand') || text.includes('notebook stand')) return 'laptop-stand';
  if (text.includes('monitor stand') || text.includes('monitor arm') || text.includes('display arm')) return 'monitor-stand';
  if (text.includes('phone stand') || text.includes('iphone stand') || text.includes('magsafe') && text.includes('stand')) return 'phone-stand';
  if (text.includes('headphone stand') || text.includes('headphone hook')) return 'headphone-stand';
  if (text.includes('speaker stand')) return 'speaker-stand';
  if (text.includes('mic arm') || text.includes('microphone arm') || text.includes('boom arm')) return 'mic-arm';

  // Desks
  if ((text.includes('desk') || text.includes('table')) &&
      !text.includes('mat') && !text.includes('shelf') && !text.includes('organizer') &&
      !text.includes('lamp') && !text.includes('pad')) return 'desk';

  // Chairs
  if (text.includes('chair') || text.includes('aeron') || text.includes('embody') ||
      text.includes('leap') || text.includes('gesture') || text.includes('secretlab')) return 'chair';

  // Displays
  if (text.includes('monitor') || text.includes('display') || text.includes('screen') ||
      text.includes('ultrafine') || text.includes('studio display')) return 'monitor';

  // Input devices
  if (text.includes('keyboard') || text.includes('keychron') || text.includes('hhkb') ||
      text.includes('nuphy') || text.includes('keycaps')) return 'keyboard';
  if (text.includes('mouse') || text.includes('trackpad') || text.includes('magic trackpad') ||
      text.includes('mx master') || text.includes('mx anywhere')) return 'mouse';

  // Audio
  if (text.includes('speaker') || text.includes('audioengine') || text.includes('kanto')) return 'speakers';
  if (text.includes('headphone') || text.includes('airpods') || text.includes('earbuds')) return 'headphones';

  // Video/streaming
  if (text.includes('webcam') || text.includes('facecam') || text.includes('brio')) return 'webcam';
  if (text.includes('stream deck') || text.includes('prompter') || text.includes('rodecaster')) return 'streaming';
  if (text.includes('camera') && !text.includes('webcam')) return 'camera';

  // Lighting
  if (text.includes('light') || text.includes('lamp') || text.includes('key light') ||
      text.includes('ring light') || text.includes('amaran') || text.includes('elgato light')) return 'lighting';

  // Connectivity
  if (text.includes('dock') || text.includes('hub') || text.includes('thunderbolt') ||
      text.includes('caldigit') || text.includes('ts4') || text.includes('ts3')) return 'dock';

  // Desk accessories
  if (text.includes('desk mat') || text.includes('desk pad') || text.includes('mousepad') ||
      text.includes('mouse pad')) return 'desk-mat';
  if (text.includes('shelf') && text.includes('desk')) return 'desk-shelf';
  if (text.includes('organizer') || text.includes('tray') || text.includes('drawer') ||
      text.includes('storage')) return 'organization';
  if (text.includes('cable') && (text.includes('management') || text.includes('organizer'))) return 'cable-management';

  // Chargers
  if (text.includes('charger') || text.includes('charging')) return 'charger';

  return 'accessory';
}

async function main() {
  const allUrls = await getUrls();
  const urls = FULL_SCRAPE ? allUrls : allUrls.slice(0, TEST_LIMIT);

  console.log(`\nStarting workspace scraper (${urls.length} pages, ${FULL_SCRAPE ? 'FULL MODE' : 'test mode'})...\n`);

  const workspaces = [];
  const allProducts = new Map(); // product name -> product data with count
  const coOccurrence = new Map(); // product -> Map of other products it appears with

  for (const url of urls) {
    const workspace = await extractWorkspace(url);

    if (workspace) {
      workspaces.push(workspace);

      // Get product keys for this workspace (for co-occurrence)
      const workspaceProductKeys = workspace.products.map(p => p.name.toLowerCase());

      // Aggregate products
      for (const product of workspace.products) {
        const key = product.name.toLowerCase();
        if (allProducts.has(key)) {
          allProducts.get(key).count++;
          allProducts.get(key).workspaces.push(workspace.id);
        } else {
          allProducts.set(key, {
            ...product,
            count: 1,
            workspaces: [workspace.id]
          });
        }

        // Track co-occurrence
        if (!coOccurrence.has(key)) {
          coOccurrence.set(key, new Map());
        }
        for (const otherKey of workspaceProductKeys) {
          if (otherKey !== key) {
            const currentCount = coOccurrence.get(key).get(otherKey) || 0;
            coOccurrence.get(key).set(otherKey, currentCount + 1);
          }
        }
      }

      const progress = `[${workspaces.length}/${urls.length}]`;
      console.log(`  ${progress} ${workspace.name}: ${workspace.products.length} products, ${workspace.images.length} images`);
    }

    // Rate limit
    await delay(1000);
  }

  // Build products array with co-occurrence data
  const productsArray = Array.from(allProducts.values())
    .map(product => {
      const key = product.name.toLowerCase();
      const coOccurrenceMap = coOccurrence.get(key) || new Map();

      // Get top 5 co-occurring products
      const oftenWith = Array.from(coOccurrenceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productKey, count]) => ({
          product: allProducts.get(productKey)?.name || productKey,
          count
        }));

      return {
        ...product,
        oftenWith
      };
    })
    .sort((a, b) => b.count - a.count);

  // Save raw workspaces
  const suffix = FULL_SCRAPE ? '' : '-test';
  const workspacesPath = path.join(__dirname, `../data/workspaces${suffix}.json`);
  fs.writeFileSync(workspacesPath, JSON.stringify(workspaces, null, 2));
  console.log(`\nSaved ${workspaces.length} workspaces to ${workspacesPath}`);

  // Save aggregated products
  const productsPath = path.join(__dirname, `../data/products${suffix}.json`);
  fs.writeFileSync(productsPath, JSON.stringify(productsArray, null, 2));
  console.log(`Saved ${productsArray.length} unique products to ${productsPath}`);

  // Summary
  console.log('\n--- SUMMARY ---');
  console.log(`Workspaces scraped: ${workspaces.length}`);
  console.log(`Unique products: ${productsArray.length}`);
  console.log(`Total images: ${workspaces.reduce((sum, w) => sum + w.images.length, 0)}`);

  console.log('\nTop 10 products (with brand):');
  productsArray.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.brand}] ${p.model} (${p.count}x) [${p.category}]`);
  });

  console.log('\nCategory breakdown:');
  const categories = {};
  productsArray.forEach(p => {
    categories[p.category] = (categories[p.category] || 0) + 1;
  });
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  console.log('\nBrand breakdown:');
  const brands = {};
  productsArray.forEach(p => {
    brands[p.brand] = (brands[p.brand] || 0) + 1;
  });
  Object.entries(brands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count}`);
    });

  // Show co-occurrence example
  const topProduct = productsArray[0];
  if (topProduct && topProduct.oftenWith.length > 0) {
    console.log(`\nCo-occurrence example for "${topProduct.name}":`);
    topProduct.oftenWith.forEach(co => {
      console.log(`  - ${co.product} (${co.count}x together)`);
    });
  }
}

main().catch(console.error);
