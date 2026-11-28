// robots.txt: every page may be crawled. The hover-card files under /peek/ and the two search indexes are
// data for the page scripts, and /indexnow/ holds the page lists for the IndexNow step (scripts/lib/indexnow.ts).
// None of them are pages, so crawlers skip them. Compare pairs (/compare/?m=a,b) are one page with a query, and
// Google spent about two-thirds of its early crawl on them, so crawlers skip the query forms and keep /compare/.
// The sitemap comes from @astrojs/sitemap.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /peek/', 'Disallow: /search.json', 'Disallow: /search-words.json', 'Disallow: /indexnow/', 'Disallow: /compare/?', '', `Sitemap: ${new URL('/sitemap-index.xml', site)}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
