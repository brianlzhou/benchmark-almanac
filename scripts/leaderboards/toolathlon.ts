// Toolathlon. toolathlon.xyz is a Mintlify docs site; its leaderboard page is also served as static markdown
// (docs/leaderboard.md, listed in the site's llms.txt for machine readers), which holds two HTML tables:
// Toolathlon-Verified (current, released 2026-06-30) and, inside the "Previous Toolathlon leaderboard"
// accordion, the archived snapshot from before Verified. The page says the two score series are not
// comparable, so the original Toolathlon is this id and Toolathlon-Verified is toolathlon-verified.ts.
// The headline is Pass@1 (the "± x" spread is dropped).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://toolathlon.xyz/docs/leaderboard.md';
const ARCHIVE_MARK = 'Previous Toolathlon leaderboard';

const strip = (cell: string) =>
  cell
    .replace(/<sub>[\s\S]*?<\/sub>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // markdown links
    .replace(/\\/g, '')
    .trim();

/** Rows of the first HTML table in `md`, keyed by header text. */
function table(md: string): Record<string, string>[] {
  const body = md.replace(/^> ?/gm, ''); // the archive sits in a blockquote
  const t = body.match(/<table>([\s\S]*?)<\/table>/)?.[1];
  if (!t) throw new Error('no table');
  const head = [...(t.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? '').matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => strip(m[1]));
  const rows = [...(t.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '').matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  return rows.map((r) => {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => strip(m[1]));
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? '']));
  });
}

export async function toolathlonRows(which: 'verified' | 'original'): Promise<LeaderboardRow[]> {
  const md = await fetchText(FEED);
  const cut = md.indexOf(ARCHIVE_MARK);
  if (cut < 0) throw new Error('archive section not found');
  const part = which === 'verified' ? md.slice(0, cut) : md.slice(cut);
  return table(part)
    .filter((r) => r.Model && Number.isFinite(parseFloat(r['Pass@1'])))
    .map((r) => ({
      model: r.Model,
      score: parseFloat(r['Pass@1']),
      harness: r.Agent && r.Agent !== 'Default' ? r.Agent : undefined,
      date: /^\d{4}-\d{2}-\d{2}$/.test(r.Date) ? r.Date : undefined,
    }));
}

export const TERMS =
  'Static markdown export of the toolathlon.xyz leaderboard page (listed in its llms.txt; robots.txt allows it and publishes no terms).';

const board: Leaderboard = {
  benchmark: 'toolathlon',
  url: 'https://toolathlon.xyz/docs/leaderboard',
  feed: `${FEED} (archived pre-Verified table)`,
  terms: TERMS,
  aliases: {},
  fetch: () => toolathlonRows('original'),
};
export default board;
