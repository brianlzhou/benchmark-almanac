// MTVQA (ByteDance). The makers keep the leaderboard as an HTML table in the bytedance/MTVQA README: per
// model the accuracy in nine languages and "AVG.", the mean over them (0 to 100), which is the score. Medal
// and trophy emoji in the cells are decoration and are dropped. Most rows come from the paper's own runs in
// 2024, so rows are dated 2024-06-01 and the resolver picks the snapshots current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { ghRaw } from './big-bench-extra-hard.ts';

const REPO = 'bytedance/MTVQA';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'mtvqa-test',
  url: `https://github.com/${REPO}#-leaderboard`,
  feed: `${FEED} (LeaderBoard table, AVG.)`,
  terms: 'README table in the bytedance/MTVQA GitHub repository, which states no license; scores are cited to the MTVQA authors.',
  aliases: {
    'InternVL2.5 78B': 'internvl2-5-78b',
    'Qwen2-VL 72B': 'qwen2-vl-72b-instruct',
    'InternVL2 76B': 'internvl2-llama3-76b',
    'InternVL-V1.5': 'internvl-chat-v1-5',
    'Gemini Ultra': 'gemini-1-0-ultra',
  },
  async fetch() {
    const t = tables(await fetchText(FEED)).find((x) => x[0]?.some((c) => /^AVG\.?$/i.test(c.text)));
    if (!t) throw new Error('MTVQA table not found');
    const iAvg = t[0].findIndex((c) => /^AVG\.?$/i.test(c.text));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[0]?.text.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim();
      const score = num(r[iAvg]?.text);
      if (model && score !== undefined) rows.push({ model, score, date: '2024-06-01' });
    }
    return rows;
  },
};
export default board;
