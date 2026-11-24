// CloudOpsBench: 45 real-world AWS cloud operations tasks for AI agents. Reads the live HTML
// leaderboard table on https://cloudopsbench.ai, extracting resolution rate (%), harness, effort
// setting, wall-clock hours, total run tokens, total run USD cost, and result detail links.
// Deliberately skips the Release date column (model release date, not evaluation date).
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://cloudopsbench.ai';

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

function parseTokens(s: string): number | undefined {
  const m = s.trim().match(/^(\d+(?:\.\d+)?)([KMB])?$/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return undefined;
  const mult = m[2]?.toUpperCase() === 'B' ? 1e9 : m[2]?.toUpperCase() === 'M' ? 1e6 : m[2]?.toUpperCase() === 'K' ? 1e3 : 1;
  return Math.round(n * mult);
}

const board: Leaderboard = {
  benchmark: 'cloudopsbench',
  url: SITE,
  feed: SITE,
  terms: 'Public open-source benchmark leaderboard published by CloudOpsBench.',
  harnesses: 'system',
  reference: ['terminus-2'],
  costPer: 'run',
  stats: {
    wallHours: { name: 'Wall time', unit: 'hours', better: 'lower', note: 'Total wall-clock runtime across the 45 AWS cloud operations tasks.' },
    totalTokens: { name: 'Total tokens', unit: 'tokens', better: 'lower', note: 'Total tokens consumed across the full benchmark run.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(SITE);
    const table = html.match(/<table[\s\S]*?<\/table>/i)?.[0];
    if (!table) throw new Error('CloudOpsBench: leaderboard table not found');
    const trMatches = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    const rows: LeaderboardRow[] = [];
    for (const tr of trMatches) {
      const cellHtmls = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      if (cellHtmls.length < 8) continue;
      const cells = cellHtmls.map(strip);
      const harness = cells[2];
      // Model cell repeats the harness name on mobile layouts (e.g. "claude-fable-5-1 (max) claude-code").
      let rawModel = cells[1];
      if (harness && rawModel.endsWith(` ${harness}`)) {
        rawModel = rawModel.slice(0, -(harness.length + 1)).trim();
      }
      let model = rawModel;
      let setting: string | undefined;
      const paren = rawModel.match(/^(.+?)\s+\(([^)]+)\)$/);
      if (paren) {
        model = paren[1].trim();
        setting = paren[2].trim();
      }
      const score = Number(cells[3].replace(/%/g, '').trim());
      if (!model || !Number.isFinite(score)) continue;

      const metrics: Record<string, number> = {};
      const hours = Number(cells[5].replace(/h$/i, '').trim());
      if (Number.isFinite(hours) && hours > 0) metrics.wallHours = hours;
      const tokens = parseTokens(cells[6]);
      if (tokens !== undefined && tokens > 0) metrics.totalTokens = tokens;
      const cost = Number(cells[7].replace(/[$,]/g, '').trim());

      const hrefRaw = cellHtmls[1].match(/href="([^"]+)"/i)?.[1]?.replace(/&amp;/g, '&');
      const link = hrefRaw ? new URL(hrefRaw, SITE).href : undefined;

      rows.push({
        model,
        score,
        ...(setting ? { setting } : {}),
        ...(harness ? { harness } : {}),
        ...(Number.isFinite(cost) && cost > 0 ? { cost } : {}),
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
