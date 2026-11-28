// EgoWitness: long-horizon egocentric memory and spatial QA benchmark spanning ~324 hours of multi-day first-person
// video with object and room re-identification across Q01, Q04, Q06, and Q07 task families. Reads the official HTML
// results table from egowitness.github.io (ordered by Micro accuracy).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://egowitness.github.io/';

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function shortRegime(header: string): string {
  if (/Direct visual/i.test(header)) return 'Direct visual reasoning';
  if (/shared-tool/i.test(header)) return 'Shared-tool controller';
  if (/Week-long/i.test(header)) return 'Week-long trained';
  return header;
}

const board: Leaderboard = {
  benchmark: 'egowitness',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on GitHub Pages by the EgoWitness authors with no robots.txt restrictions.',
  parts: {
    q01: { name: 'Q01', group: 'Question family' },
    q04: { name: 'Q04', group: 'Question family' },
    q06: { name: 'Q06', group: 'Question family' },
    q07: { name: 'Q07', group: 'Question family' },
  },
  stats: {
    macro: { name: 'Macro accuracy', unit: '%', better: 'higher', note: 'Unweighted mean accuracy across Q01, Q04, Q06, and Q07.' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
    const resTable = tables.find((t) => t.includes('Q01') && t.includes('Micro'));
    if (!resTable) throw new Error('EgoWitness results table not found');
    const out: LeaderboardRow[] = [];
    let regime = 'Direct visual reasoning';
    for (const tr of resTable.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
      const cells = [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => stripTags(m[1]));
      if (cells.length === 1 && cells[0]) {
        regime = shortRegime(cells[0]);
        continue;
      }
      if (cells.length < 7 || cells[0] === 'Model or system') continue;
      const model = cells[0];
      const [q01, q04, q06, q07, macro, micro] = cells.slice(1, 7).map(Number);
      if (![q01, q04, q06, q07, macro, micro].every(Number.isFinite)) continue;
      out.push({
        model,
        setting: regime,
        score: micro,
        metrics: { q01, q04, q06, q07, macro },
      });
    }
    if (out.length < 15) throw new Error(`EgoWitness returned only ${out.length} rows`);
    return out;
  },
};
export default board;
