// NaturalBench: G-Acc is the headline group accuracy. Acc, Q-Acc and I-Acc remain metrics.
// Model rows preserve language backbones where the table spans a model family across several rows.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2410.14669";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "naturalbench",
  url: "https://linzhiqiu.github.io/papers/naturalbench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED))[4];
    if (!t?.[1]?.some(c => c.text === 'G-Acc')) throw new Error('NaturalBench table changed');
    const rows: LeaderboardRow[] = []; let family = '';
    for (const r of t) {
      if (![6,8].includes(r.length) || /^(Human|Random)/.test(r[0].text)) continue;
      const offset = r.length === 8 ? 2 : 0;
      if (num(r[offset+1]?.text) === undefined) continue;
      if (r.length === 8) family = paperModel(r[0].text);
      const backbone = r[offset].text;
      const model = family + (backbone ? ` (${backbone})` : '');
      rows.push({model, score:num(r[offset+4].text)!, metrics:{accuracy:num(r[offset+1].text)!, questionAccuracy:num(r[offset+2].text)!, imageAccuracy:num(r[offset+3].text)!}});
    }
    if (rows.length < 55) throw new Error('NaturalBench expected at least 55 rows');
    return rows;
  },
};
export default board;
