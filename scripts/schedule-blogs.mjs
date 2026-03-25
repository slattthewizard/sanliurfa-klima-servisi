/**
 * Sets 5 blogs to published:true now, schedules the rest every 3 days at 10am Turkey time.
 * Adds publishDate to all blog frontmatter.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const BLOG_DIR = './src/content/blog';

// 5 diverse topics to publish immediately
const PUBLISH_NOW = [
  'klima-bakimi-nasil-yapilir',        // Maintenance how-to
  'klima-sogutmuyor',                   // Troubleshooting
  'en-iyi-klima-markalari',             // Buying guide
  'klima-gaz-dolumu-fiyatlari',         // Pricing
  'kac-btu-klima-almaliyim',            // Technical guide
];

async function main() {
  const files = (await readdir(BLOG_DIR)).filter(f => f.endsWith('.md'));
  const nowFiles = [];
  const laterFiles = [];

  for (const file of files) {
    const slug = file.replace('.md', '');
    if (PUBLISH_NOW.includes(slug)) {
      nowFiles.push(file);
    } else {
      laterFiles.push(file);
    }
  }

  // Shuffle laterFiles for variety in scheduling order
  laterFiles.sort(() => Math.random() - 0.5);

  // Schedule: starting 3 days from now, one every 3 days
  const today = new Date('2026-03-25');

  // Process "publish now" files
  for (const file of nowFiles) {
    const filePath = join(BLOG_DIR, file);
    let content = await readFile(filePath, 'utf-8');
    const todayStr = today.toISOString().split('T')[0];

    if (content.includes('published:')) {
      content = content.replace(/published:.*/, `published: true`);
    } else {
      content = content.replace(/slug: "(.*?)"/, `slug: "$1"\npublished: true`);
    }

    await writeFile(filePath, content, 'utf-8');
    console.log(`✓ NOW  ${file}`);
  }

  // Process scheduled files
  let dayOffset = 3;
  for (const file of laterFiles) {
    const filePath = join(BLOG_DIR, file);
    let content = await readFile(filePath, 'utf-8');

    const publishDate = new Date(today);
    publishDate.setDate(publishDate.getDate() + dayOffset);
    const dateStr = publishDate.toISOString().split('T')[0];

    if (content.includes('published:')) {
      content = content.replace(/published:.*/, `published: false`);
    } else {
      content = content.replace(/slug: "(.*?)"/, `slug: "$1"\npublished: false`);
    }

    // Add or update publishDate
    if (content.includes('publishDate:')) {
      content = content.replace(/publishDate:.*/, `publishDate: "${dateStr}"`);
    } else {
      content = content.replace(/published: false/, `published: false\npublishDate: "${dateStr}"`);
    }

    await writeFile(filePath, content, 'utf-8');
    console.log(`📅 ${dateStr}  ${file}`);
    dayOffset += 3;
  }

  const lastDate = new Date(today);
  lastDate.setDate(lastDate.getDate() + dayOffset - 3);
  console.log(`\n✓ ${nowFiles.length} published now, ${laterFiles.length} scheduled`);
  console.log(`📅 Last post publishes: ${lastDate.toISOString().split('T')[0]}`);
}

main().catch(console.error);
