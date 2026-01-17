const fs = require('fs');
const path = require('path');

// Product name normalization rules
const NORMALIZATIONS = {
  // MX Master variants -> canonical form
  'mx master 3s': 'Logitech MX Master 3S',
  'mx master 3': 'Logitech MX Master 3',
  'mx master 2s': 'Logitech MX Master 2S',
  'mx master 2': 'Logitech MX Master 2',
  'mx master': 'Logitech MX Master',

  // Magic Keyboard variants
  'magic keyboard': 'Apple Magic Keyboard',
  'apple keyboard': 'Apple Magic Keyboard',
  'apple wireless keyboard': 'Apple Magic Keyboard',

  // Magic Trackpad
  'magic trackpad': 'Apple Magic Trackpad',
  'apple trackpad': 'Apple Magic Trackpad',

  // Elgato products
  'key light': 'Elgato Key Light',
  'keylight': 'Elgato Key Light',
  'key light air': 'Elgato Key Light Air',
  'keylight air': 'Elgato Key Light Air',
  'stream deck': 'Elgato Stream Deck',
  'streamdeck': 'Elgato Stream Deck',
  'cam link': 'Elgato Cam Link 4K',
  'camlink': 'Elgato Cam Link 4K',

  // Audio-Technica
  'ath-m50x': 'Audio-Technica ATH-M50x',
  'ath m50x': 'Audio-Technica ATH-M50x',

  // CalDigit
  'ts3+': 'CalDigit TS3 Plus',
  'ts3 plus': 'CalDigit TS3 Plus',
  'ts3': 'CalDigit TS3 Plus',
  'ts4': 'CalDigit TS4',

  // BenQ
  'screenbar': 'BenQ ScreenBar',
  'screen bar': 'BenQ ScreenBar',
  'screenbar halo': 'BenQ ScreenBar Halo',

  // Twelve South
  'bookarc': 'Twelve South BookArc',
  'book arc': 'Twelve South BookArc',

  // Audioengine
  'a2+': 'Audioengine A2+',

  // NuPhy
  'air75': 'NuPhy Air75',
  'air 75': 'NuPhy Air75',

  // AirPods
  'airpods pro': 'Apple AirPods Pro',
  'airpods max': 'Apple AirPods Max',
  'airpods': 'Apple AirPods',

  // Herman Miller chairs
  'aeron': 'Herman Miller Aeron',
  'embody': 'Herman Miller Embody',

  // Studio Display
  'studio display': 'Apple Studio Display',

  // Shure mics
  'mv7': 'Shure MV7',
  'sm7b': 'Shure SM7B',
};

// Brand corrections
const BRAND_FIXES = {
  'MX': 'Logitech',
  'Magic': 'Apple',
  'AirPods': 'Apple',
  'Logi': 'Logitech',
  'Audio Engine': 'Audioengine',
  'El Gato': 'Elgato',
  'TwelveSouth': 'Twelve South',
  'LG': null, // Will be fixed based on product name
};

// Products that got wrong brand due to substring matching
const PRODUCT_BRAND_OVERRIDES = {
  'elgato': 'Elgato',  // elgato contains "lg" but is not LG
  'key light': 'Elgato',
  'keylight': 'Elgato',
  'stream deck': 'Elgato',
  'streamdeck': 'Elgato',
  'cam link': 'Elgato',
  'camlink': 'Elgato',
  'wave mic': 'Elgato',
  'iloud': 'IK Multimedia',
  'avantree': 'Avantree',
  'zflip': 'Samsung',
  'z flip': 'Samsung',
  'galaxy': 'Samsung',
  'aeropress': 'AeroPress',
  'sonos': 'Sonos',
  '3m ': '3M',
  'amazon': 'Amazon',
};

// Skip these non-tech products and generic items
const SKIP_PRODUCTS = [
  'plant', 'plants', 'pothos', 'succulent',
  'water bottle', 'mug', 'cup', 'coaster',
  'post-it', 'whiteboard', 'notebook', 'pen',
  'candle', 'diffuser', 'humidifier',
  'cloudapp', // software
  '‍', // empty/invisible character
];

function normalizeProductName(name) {
  // Clean up the name
  let clean = name
    .replace(/\s+/g, ' ')           // normalize whitespace
    .replace(/[""]/g, '"')          // normalize quotes
    .replace(/\s*[-–—]\s*/g, ' ')   // normalize dashes
    .trim();

  // Check for exact normalizations first
  const lower = clean.toLowerCase();

  // Try to find a matching normalization
  for (const [pattern, canonical] of Object.entries(NORMALIZATIONS)) {
    if (lower.includes(pattern)) {
      // Check if it's a variant (has extra words)
      const hasVariant = lower.replace(pattern, '').trim().length > 0;

      // For variants like "with Touch ID", append to canonical
      if (hasVariant) {
        const variant = clean.replace(new RegExp(pattern, 'i'), '').trim();
        // Only keep meaningful variants
        if (variant.match(/touch id|numeric|numpad|for mac/i)) {
          return canonical + ' ' + variant.replace(/^[\s\-–]+/, '');
        }
      }
      return canonical;
    }
  }

  return clean;
}

function getCanonicalKey(name) {
  // Create a key for grouping similar products
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/mouse$/, '')
    .replace(/keyboard$/, '')
    .replace(/monitor$/, '')
    .replace(/display$/, '')
    .replace(/speaker[s]?$/, '')
    .replace(/x2$/, '')
    .replace(/x 2$/, '');
}

function fixBrand(brand, productName) {
  const nameLower = productName.toLowerCase();

  // Check for product-specific brand overrides first (fixes LG/Elgato issue)
  for (const [pattern, correctBrand] of Object.entries(PRODUCT_BRAND_OVERRIDES)) {
    if (nameLower.includes(pattern)) {
      return correctBrand;
    }
  }

  // Fix known brand issues
  if (BRAND_FIXES[brand] !== undefined) {
    if (BRAND_FIXES[brand] === null) {
      // Brand needs to be determined from product name
      // If it's actually an LG product (monitor, TV, etc)
      if (nameLower.includes('ultrafine') || nameLower.includes('ultragear') ||
          nameLower.match(/\blg\s+\d/) || nameLower.startsWith('lg ')) {
        return 'LG';
      }
      // Otherwise keep original brand (probably misdetected)
      return brand;
    }
    return BRAND_FIXES[brand];
  }

  // If brand is Unknown, try to extract from product name
  if (brand === 'Unknown') {
    // Apple products
    if (nameLower.includes('macbook') || nameLower.includes('imac') ||
        nameLower.includes('ipad') || nameLower.includes('magic') ||
        nameLower.includes('airpods')) {
      return 'Apple';
    }

    // Skip non-products
    for (const skip of SKIP_PRODUCTS) {
      if (nameLower.includes(skip) || nameLower === skip) {
        return 'Skip';
      }
    }
  }

  return brand;
}

function deduplicate(products) {
  const groups = new Map();

  for (const product of products) {
    // Fix brand first
    const fixedBrand = fixBrand(product.brand, product.name);

    // Skip non-products
    if (fixedBrand === 'Skip') continue;

    // Normalize the name
    const normalizedName = normalizeProductName(product.name);
    const key = getCanonicalKey(normalizedName);

    if (groups.has(key)) {
      const existing = groups.get(key);
      // Merge: add counts and workspaces
      existing.count += product.count;
      existing.workspaces = [...new Set([...existing.workspaces, ...product.workspaces])];
      // Merge co-occurrence data
      if (product.oftenWith) {
        existing.oftenWith = existing.oftenWith || [];
        for (const co of product.oftenWith) {
          const existingCo = existing.oftenWith.find(e => e.product === co.product);
          if (existingCo) {
            existingCo.count += co.count;
          } else {
            existing.oftenWith.push(co);
          }
        }
      }
    } else {
      groups.set(key, {
        ...product,
        name: normalizedName,
        brand: fixedBrand,
      });
    }
  }

  // Sort by count and clean up
  return Array.from(groups.values())
    .map(p => ({
      ...p,
      oftenWith: (p.oftenWith || [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }))
    .sort((a, b) => b.count - a.count);
}

function main() {
  const inputPath = path.join(__dirname, '../data/products.json');
  const outputPath = path.join(__dirname, '../data/products-clean.json');

  console.log('Loading products...');
  const products = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`Loaded ${products.length} products`);

  console.log('\nDeduplicating...');
  const cleaned = deduplicate(products);
  console.log(`Reduced to ${cleaned.length} unique products`);

  // Save
  fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2));
  console.log(`\nSaved to ${outputPath}`);

  // Summary
  console.log('\n--- TOP 20 PRODUCTS ---');
  cleaned.slice(0, 20).forEach((p, i) => {
    console.log(`${i + 1}. [${p.brand}] ${p.name} (${p.count}x)`);
  });

  // Brand distribution
  console.log('\n--- BRAND DISTRIBUTION ---');
  const brands = {};
  cleaned.forEach(p => {
    brands[p.brand] = (brands[p.brand] || 0) + 1;
  });
  Object.entries(brands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count}`);
    });

  // Check for remaining Unknown
  const stillUnknown = cleaned.filter(p => p.brand === 'Unknown');
  if (stillUnknown.length > 0) {
    console.log(`\n--- STILL UNKNOWN (${stillUnknown.length}) ---`);
    stillUnknown.slice(0, 10).forEach(p => console.log(`  ${p.name}`));
  }
}

main();
