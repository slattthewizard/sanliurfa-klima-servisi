/**
 * Converts blog markdown files from SEO format to Astro content collection format.
 *
 * Input frontmatter:
 *   Meta Title: ...
 *   Meta Description: ...
 *   Primary Keyword: ...
 *   URL Slug: /blog/slug-here
 *
 * Output frontmatter:
 *   title: "..."
 *   description: "..."
 *   keyword: "..."
 *   slug: "slug-here"
 *   date: "2026-03-23"
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';

const INPUT_DIR = process.argv[2] || 'd:/SEO AC/AC BLOGS';
const OUTPUT_DIR = process.argv[3] || './src/content/blog';

async function processFile(filePath) {
  const raw = await readFile(filePath, 'utf-8');
  const fileName = basename(filePath);

  // Extract date from filename (e.g., klima-bakimi-2026-03-23.md)
  const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})\.md$/);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

  // Split frontmatter and content
  const parts = raw.split('---');
  if (parts.length < 3) {
    console.warn(`Skipping ${fileName}: no frontmatter found`);
    return null;
  }

  const frontmatterRaw = parts[1].trim();
  const content = parts.slice(2).join('---').trim();

  // Parse the key-value frontmatter
  const meta = {};
  for (const line of frontmatterRaw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    meta[key] = value;
  }

  const title = meta['Meta Title'] || '';
  const description = meta['Meta Description'] || '';
  const keyword = meta['Primary Keyword'] || '';
  const keywords = meta['Secondary Keywords'] || '';
  const slugRaw = meta['URL Slug'] || '';
  const slug = slugRaw.replace(/^\/blog\//, '');

  if (!slug) {
    console.warn(`Skipping ${fileName}: no URL Slug`);
    return null;
  }

  // Fix internal links to use relative paths
  let processedContent = content
    // Fix absolute internal links to relative
    .replace(/https?:\/\/sanliurfaklimaservisi\.com\/blog\//g, '/blog/')
    // Fix phone numbers to real number
    .replace(/0414 000 00 00/g, '0553 397 52 44')
    .replace(/tel:04140000000/g, 'tel:+905533975244');

  // Build new frontmatter
  const newFrontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `keyword: "${keyword.replace(/"/g, '\\"')}"`,
    `keywords: "${keywords.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `slug: "${slug}"`,
    '---',
  ].join('\n');

  const output = `${newFrontmatter}\n\n${processedContent}\n`;
  const outPath = join(OUTPUT_DIR, `${slug}.md`);
  await writeFile(outPath, output, 'utf-8');
  console.log(`✓ ${slug}.md`);
  return slug;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = (await readdir(INPUT_DIR)).filter(f => f.endsWith('.md'));
  console.log(`Processing ${files.length} blog files...\n`);

  const results = [];
  for (const file of files) {
    const slug = await processFile(join(INPUT_DIR, file));
    if (slug) results.push(slug);
  }

  console.log(`\n✓ Done. ${results.length} blogs processed into ${OUTPUT_DIR}`);
}

main().catch(console.error);
