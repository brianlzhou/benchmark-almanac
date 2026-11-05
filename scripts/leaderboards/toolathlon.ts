// Toolathlon. toolathlon.xyz is a Mintlify docs site; its leaderboard page is also served as static markdown
// (docs/leaderboard.md, listed in the site's llms.txt for machine readers), which holds two HTML tables:
// Toolathlon-Verified (current, released 2026-06-30) and, inside the "Previous Toolathlon leaderboard"
// accordion, the archived snapshot from before Verified. The page says the two score series are not
// comparable, so the original Toolathlon is this id and Toolathlon-Verified is toolathlon-verified.ts.
// The headline is Pass@1. With `metrics: true` (this archived table) rows also keep the Pass@1 "± x" spread
// (`sd`), Pass@3 (`passAt3`), Pass^3 (`pass3`), # Turns (`turns`) and, where the table has it, # Tool Calls
// (`toolCalls`), all per task. "--" cells are left out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://toolathlon.xyz/docs/leaderboard.md';
const ARCHIVE_MARK = 'Previous Toolathlon leaderboard';

// "<sup>‡</sup>" marks OpenAI runs redone through the Responses API (page footnote); it is kept as a word
const strip = (cell: string) =>
  cell
    .replace(/<sup>‡<\/sup>/g, ' RESPONSES_API')
    .replace(/<su[bp]>[\s\S]*?<\/su[bp]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // markdown links
    .replace(/\\/g, '')
    .trim();

/** Rows of the first HTML table in `md`, keyed by header text; "raw:<header>" holds the cell before stripping. */
function table(md: string): Record<string, string>[] {
  const body = md.replace(/^> ?/gm, ''); // the archive sits in a blockquote
  const t = body.match(/<table>([\s\S]*?)<\/table>/)?.[1];
  if (!t) throw new Error('no table');
  const head = [...(t.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? '').matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => strip(m[1]));
  const rows = [...(t.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '').matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  return rows.map((r) => {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => strip(m[1]));
    const raw = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    return Object.fromEntries(head.flatMap((h, i) => [[h, cells[i] ?? ''], [`raw:${h}`, raw[i] ?? '']]));
  });
}

/** The per-task numbers of one table row, by metric key; see the header. */
function rowMetrics(r: Record<string, string>): Record<string, number> {
  const m: Record<string, number> = {};
  const sd = r['raw:Pass@1']?.match(/<sub>\s*±\s*([\d.]+)/)?.[1];
  if (sd) m.sd = Number(sd);
  for (const [k, h] of [['passAt3', 'Pass@3'], ['pass3', 'Pass^3'], ['turns', '# Turns'], ['toolCalls', '# Tool Calls']]) {
    const v = parseFloat(r[h] ?? '');
    if (Number.isFinite(v)) m[k] = v;
  }
  return m;
}

export async function toolathlonRows(which: 'verified' | 'original', opts?: { metrics?: boolean }): Promise<LeaderboardRow[]> {
  const md = await fetchText(FEED);
  const cut = md.indexOf(ARCHIVE_MARK);
  if (cut < 0) throw new Error('archive section not found');
  const part = which === 'verified' ? md.slice(0, cut) : md.slice(cut);
  return table(part)
    .filter((r) => r.Model && Number.isFinite(parseFloat(r['Pass@1'])))
    .map((r) => {
      const responses = r.Model.includes(' RESPONSES_API');
      const agent = r.Agent && r.Agent !== 'Default' ? r.Agent : undefined;
      return {
        model: r.Model.replace(' RESPONSES_API', '').trim(),
        score: parseFloat(r['Pass@1']),
        harness: responses ? [agent, 'Responses API'].filter(Boolean).join(', ') : agent,
        date: /^\d{4}-\d{2}-\d{2}$/.test(r.Date) ? r.Date : undefined,
        ...(opts?.metrics && Object.keys(rowMetrics(r)).length ? { metrics: rowMetrics(r) } : {}),
      };
    });
}

export const TERMS =
  'Static markdown export of the toolathlon.xyz leaderboard page (listed in its llms.txt; robots.txt allows it and publishes no terms).';

const board: Leaderboard = {
  benchmark: 'toolathlon',
  url: 'https://toolathlon.xyz/docs/leaderboard',
  feed: `${FEED} (archived pre-Verified table)`,
  terms: TERMS,
  aliases: {
    'Qwen3.5-Plus': 'qwen-3-5-plus-hosted-397b-a17b',
    'Kimi-K2-0905': 'kimi-k2-sep-2025',
  },
  fetch: () => toolathlonRows('original', { metrics: true }),
};
export default board;
