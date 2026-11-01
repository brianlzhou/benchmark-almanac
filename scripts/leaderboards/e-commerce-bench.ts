// E-Commerce Bench (Qwen). The leaderboard is Table 1 in the QwenLM/E-CommerceBench README, an HTML table
// of 21 models (five episodes each) grouped into tiers. The README names the asset multiplier, end-of-year
// assets over the ¥100,000 opening balance, as the primary score; the table gives mean final assets in
// thousands of yuan, so the score is that figure divided by 100 (1,431 ¥k is a multiplier of 14.31).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/QwenLM/E-CommerceBench/main/README.md';

const board: Leaderboard = {
  benchmark: 'e-commerce-bench',
  url: 'https://github.com/QwenLM/E-CommerceBench#results',
  feed: `${FEED} (Table 1, mean final assets)`,
  terms: 'README table in the QwenLM/E-CommerceBench repository, licensed Apache-2.0.',
  aliases: {},
  async fetch() {
    const [t] = tables(await fetchText(FEED));
    const head = t?.[0]?.map((c) => c.text);
    if (head?.[0] !== 'Model' || !/^Final assets/.test(head?.[1] ?? '')) throw new Error(`unexpected E-Commerce Bench header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      if (r.length < 3) continue; // tier label rows span the table
      const assets = num(r[1]?.text);
      if (!r[0]?.text || assets === undefined) continue;
      rows.push({ model: r[0].text, score: assets / 100 });
    }
    return rows;
  },
};
export default board;
