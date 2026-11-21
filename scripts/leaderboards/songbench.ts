// SongBench judges seven aspects of generated songs. Its paper's comparison table gives the authors' mean score and each component.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2604.25937v1";

const board: Leaderboard = {
  benchmark: "songbench", static: 'paper',
  url: "https://github.com/Tencent/SongBench#-experimental-results",
  feed,
  terms: "Tencent limits the released materials to academic use. The score table has no separate reuse grant. https://raw.githubusercontent.com/Tencent/SongBench/main/LICENSE.txt GitHub requests a one-second crawl delay.",
  parts: Object.fromEntries(['Melody','Arrangement','Musicality','Vocal','Instrument','Mixing','Structure'].map(k => [k,k])),
  stats: { songEval: { name: 'SongEval', unit: 'score', better: 'higher' } },
  async fetch() {
    const names = Object.keys(board.parts!);
    const t = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === ['Model', ...names, 'Mean (Ours)', 'SongEval'].join('|'));
    if (!t) throw new Error('Missing SongBench comparison');
    const rows = t.slice(1).filter(c => c.length > 1).map(c => {
      const values = c.slice(1).map(v => num(v.text));
      if (values.length !== 9 || values.some(v => v === undefined)) throw new Error('Incomplete song ratings');
      return { model: c[0].text, score: values[7]!, metrics: { ...Object.fromEntries(names.map((k,i) => [k,values[i]!])), songEval: values[8]! } };
    });
    if (rows.length < 11) throw new Error('Missing song generators');
    return rows;
  },
};

export default board;
