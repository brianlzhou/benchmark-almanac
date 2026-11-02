// SuperCLUE-Safety (SC-Safety, CLUE benchmark group). The board is the markdown table under "SC-Safety安全总榜"
// (overall safety board) in the CLUEbenchmark/SuperCLUE-Safety README, ranked by 总分 (total score, 0 to 100),
// which is the score. The board was published in October 2023 and not updated, so rows are dated 2023-10-15
// and the resolver picks the snapshots current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdRecords, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'CLUEbenchmark/SuperCLUE-Safety';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'superclue-safety',
  url: `https://github.com/${REPO}`,
  feed: `${FEED} (SC-Safety安全总榜, 总分)`,
  terms: 'README table in the CLUEbenchmark/SuperCLUE-Safety GitHub repository, which states no license; scores are cited to SuperCLUE.',
  aliases: {
    GPT4: 'gpt-4-jun-2023',
    'Yi-34B-Chat': 'yi-34b',
    'Qwen-7B-Chat': 'qwen-7b',
    'gpt-3.5-turbo': 'gpt-3-5-turbo-jun-2023',
    'Llama-2-13B-Chat': 'llama-2-13b',
  },
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => /安全总榜/.test(x.heading) && x.head.includes('总分'));
    if (!t) throw new Error('SC-Safety overall table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of mdRecords(t)) {
      const score = Number(r['总分']);
      if (r['模型'] && Number.isFinite(score)) rows.push({ model: r['模型'], score, date: '2023-10-15' });
    }
    return rows;
  },
};
export default board;
