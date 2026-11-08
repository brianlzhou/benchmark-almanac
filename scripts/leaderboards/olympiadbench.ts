// OlympiadBench (Tsinghua and partners, ACL 2024). The makers keep the leaderboard as two markdown tables in
// the OpenBMB/OlympiadBench README: the full multimodal benchmark and the text-only problems. The almanac's
// record is the full benchmark, so the "Experiment with full benchmark" table's "Avg." column (accuracy over
// math and physics, 0 to 100) is the score. Text-only results are a subset and are excluded.
// Undated API names remain unlisted instead of receiving a guessed snapshot date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'OpenBMB/OlympiadBench';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'olympiadbench',
  url: `https://github.com/${REPO}#leaderboard`,
  feed: `${FEED} (full benchmark, Avg.)`,
  terms: 'README table in the OpenBMB/OlympiadBench GitHub repository, which is MIT-licensed.',
  aliases: {
    'Gemini-Pro-Vision': 'gemini-1-0-pro-vision',
    'LLaVA-NeXT-34B': 'llava-v1-6-34b',
    'Claude3-Opus': 'claude-3-opus',
  },
  async fetch() {
    const all = mdTables(await fetchText(FEED));
    const t = all.find((x) => /full benchmark/i.test(x.heading));
    if (!t) throw new Error('full benchmark table not found');
    const iAvg = t.head.findIndex((h) => /^avg/i.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const score = Number(r[iAvg]);
      if (r[0] && Number.isFinite(score)) rows.push({ model: r[0], score, setting: 'Full benchmark' });
    }
    return rows;
  },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
