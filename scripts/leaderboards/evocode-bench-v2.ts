// EvoCode-Bench v2 (the 2026-06-20 re-release; UniPat AI). The leaderboard is the markdown table under
// "## Results" in the UniPat-AI/EvoCodeBench README: per model, with the terminus-2 scaffold, the Dataset
// score (passed rounds over all rounds, averaged per task, 0 to 100, the ranking), the Case score and
// counts. Dataset score is the score. The Reasoning column ("effort `xhigh`", "thinking on¹") becomes the
// setting, and terminus-2 is the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/UniPat-AI/EvoCodeBench/main/README.md';

const board: Leaderboard = {
  benchmark: 'evocode-bench-v2',
  url: 'https://unipat.ai/benchmarks/EvoCode-Bench',
  feed: `${FEED} (Results table, Dataset score)`,
  terms: 'README table in the UniPat-AI/EvoCodeBench repository, licensed MIT.',
  aliases: {
    'Doubao-Seed-2.1-Pro': 'seed-2-1-pro',
  },
  async fetch() {
    const md = await fetchText(FEED);
    const section = md.slice(md.indexOf('## Results'));
    const lines = section.split('\n').filter((l) => l.startsWith('|'));
    const start = lines.findIndex((l) => /\|\s*Agent\s*\|\s*Reasoning\s*\|\s*Dataset score/.test(l));
    if (start < 0) throw new Error('no EvoCode-Bench results table in the README');
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(start + 2)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const score = num(cells[2]);
      if (!cells[0] || score === undefined) break;
      // "effort `xhigh`" -> "xhigh"; "thinking on¹" -> "thinking"; "thinking `adaptive`" -> "adaptive"
      const reasoning = cells[1].replace(/[`¹²³]/g, '').trim();
      const setting = reasoning.match(/^(?:effort|thinking)\s+(\w+)$/)?.[1]?.replace(/^on$/, 'thinking') ?? (reasoning || undefined);
      rows.push({ model: cells[0], score, setting, harness: 'terminus-2' });
    }
    return rows;
  },
};
export default board;
