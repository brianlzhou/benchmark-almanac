// SAT: SAT Real Avg. is accuracy on the 150-question real-image test set described by the catalog.
// The synthetic set stays a metric. SAT-trained variants retain their backbone and training label.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2412.07755";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "sat-spatial-aptitude",
  url: "https://arijitray.com/SAT/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED))[1];
    if (!t?.[0]?.some(c => c.text === 'SAT Real')) throw new Error('SAT Real table changed');
    const rows: LeaderboardRow[] = []; let previous = '';
    for (const r of t) {
      if (r.length !== 8 || !/^[a-i][.] /.test(r[0].text)) continue;
      let model = r[0].text.replace(/^[a-i][.] /, '');
      if (model === '+ SAT') model = previous + ' (SAT trained)'; else previous = model;
      rows.push({model: paperModel(model), score:num(r[1].text)!, metrics:{syntheticAccuracy:num(r[7].text)!}});
    }
    if (rows.length !== 9) throw new Error('SAT expected nine rows');
    return rows;
  },
};
export default board;
