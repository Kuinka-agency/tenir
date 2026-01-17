const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const SITEMAP_URL = 'https://www.workspaces.xyz/sitemap.xml';

async function fetchWorkspaceUrls() {
  console.log('Fetching sitemap from workspaces.xyz...');

  const response = await fetch(SITEMAP_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status}`);
  }

  const xml = await response.text();

  // Extract all /p/ URLs using regex (simple and effective for sitemap)
  // Matches both patterns: /p/123-name and /p/workspaces-123-name
  const urlPattern = /<loc>(https:\/\/www\.workspaces\.xyz\/p\/[^<]+)<\/loc>/g;
  const urls = [];
  let match;

  while ((match = urlPattern.exec(xml)) !== null) {
    urls.push(match[1]);
  }

  // Helper to extract workspace number from URL
  const getWorkspaceNum = (url) => {
    // Match /p/123-name or /p/workspaces-123-name
    const match = url.match(/\/p\/(?:workspaces-)?(\d+)-/);
    return match ? parseInt(match[1]) : 0;
  };

  // Sort by workspace number (descending - newest first)
  urls.sort((a, b) => getWorkspaceNum(b) - getWorkspaceNum(a));

  console.log(`Found ${urls.length} workspace URLs`);

  // Save to file
  const outputPath = path.join(__dirname, '../data/urls.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    count: urls.length,
    urls: urls
  }, null, 2));

  console.log(`Saved to ${outputPath}`);

  // Show first and last few
  console.log('\nNewest workspaces:');
  urls.slice(0, 5).forEach(url => console.log(`  ${url}`));
  console.log('\nOldest workspaces:');
  urls.slice(-3).forEach(url => console.log(`  ${url}`));

  return urls;
}

// Run if called directly
if (require.main === module) {
  fetchWorkspaceUrls().catch(console.error);
}

module.exports = { fetchWorkspaceUrls };
