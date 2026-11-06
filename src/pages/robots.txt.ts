// robots.txt: every page may be crawled. The hover-card files under /peek/ and the two search indexes are
// data for the page scripts, not pages, so crawlers skip them. The sitemap comes from @astrojs/sitemap.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /peek/', 'Disallow: /search.json', 'Disallow: /search-words.json', '', `Sitemap: ${new URL('/sitemap-index.xml', site)}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
