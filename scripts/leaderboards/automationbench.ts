// AutomationBench (Zapier). zapier.com/benchmarks is a static Framer page with no data file behind it; the
// leaderboard is server-rendered markup, one `<div class="abp-row">` per row with rank, model, score and
// cost. Only the ranked rows (first cell a number) are read; the per-domain rows below them are skipped.
// The page shows the current top ten. Zapier's terms of service and acceptable use policy set no rule
// against automated reading. The official score is the pass rate on Zapier's held-out private task set.
//
// Names carry the setting in parentheses: "GPT-6 Astra (XHigh)", "Claude Opus 5.5 (default fallbacks,
// Max)". The last part is the effort; anything before it ("default fallbacks") is the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://zapier.com/benchmarks';
const EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'none']);

const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .trim();

const board: Leaderboard = {
  benchmark: 'automationbench',
  url: PAGE,
  feed: `${PAGE} (server-rendered leaderboard rows)`,
  terms: "Static page on zapier.com; Zapier's terms of service and acceptable use policy do not restrict automated reading.",
  aliases: {},
  async fetch() {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    for (const chunk of html.split('<div class="abp-row"').slice(1)) {
      const cells = [...chunk.slice(0, 8000).matchAll(/<span style="font-family[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
      const [rank, name, score] = cells;
      if (!/^\d+$/.test(rank ?? '') || !/%$/.test(score ?? '')) continue;
      const paren = name.match(/^(.*?)\s*\(([^)]*)\)$/);
      let model = name;
      let setting: string | undefined;
      let harness: string | undefined;
      if (paren) {
        const parts = paren[2].split(',').map((p) => p.trim());
        const last = parts.at(-1)!.toLowerCase();
        if (EFFORTS.has(last)) {
          model = paren[1];
          setting = last;
          harness = parts.slice(0, -1).join(', ') || undefined;
        }
      }
      rows.push({ model, score: parseFloat(score), setting, harness });
    }
    if (!rows.length) throw new Error('no leaderboard rows found; the page layout may have changed');
    return rows;
  },
};
export default board;
