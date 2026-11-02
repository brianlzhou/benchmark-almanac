// RW-Search (Meituan AGI-Eval). The makers keep the leaderboard as an HTML table in the
// AGI-Eval-Official/RW-Search README, under "Models (w/o context management)": Class, Model and Score
// (accuracy on the 200 questions, 0 to 100). The Class cell spans several rows, so each row's model is its
// second-to-last cell and the score its last. Names follow the API ids, with "-thinking", "-reasoner" or
// "(xhigh)" marking the mode. DeepSeek's "-reasoner" is its thinking mode and becomes that setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { ghRaw } from './big-bench-extra-hard.ts';

const REPO = 'AGI-Eval-Official/RW-Search';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'rwsearch',
  url: `https://github.com/${REPO}#-leaderboard`,
  feed: `${FEED} (LeaderBoard table, Score)`,
  terms: 'README table in the AGI-Eval-Official/RW-Search GitHub repository, which is MIT-licensed.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(FEED)).find((x) => x[0]?.map((c) => c.text).join('|') === 'Class|Model|Score');
    if (!t) throw new Error('RW-Search leaderboard table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      if (r.length < 2) continue;
      let model = r[r.length - 2].text;
      const score = num(r[r.length - 1].text);
      if (!model || score === undefined) continue;
      const reasoner = /-reasoner$/.test(model);
      if (reasoner) model = model.replace(/-reasoner$/, '');
      rows.push({ model, score, setting: reasoner ? 'thinking' : undefined });
    }
    return rows;
  },
};
export default board;
