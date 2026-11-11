// V* Bench: Table 1 reports Overall (%) across all 191 images. Attribute and spatial scores remain metrics.
//  These are the paper's static results and will not refresh with new model releases.
//  Human and random references are excluded. Pipeline names remain unlisted systems when the backbone is not stated.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2312.14135";

const board: Leaderboard = {
  benchmark: "v",
  url: "https://vstar-seal.github.io/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Overall (%)'));
    if (!t) throw new Error('V* main results table missing');
    const rows = t.slice(1).filter(r => r.length === 4 && num(r[3]?.text) !== undefined && !/^(Human|Random)/.test(r[0].text)).map(r => ({
      model: r[0].text.replace(/\s*\[\s*\d+\s*\]/g, '').replace(' (Ours)', ''), score: num(r[3].text)!,
      metrics: {attribute: num(r[1].text)!, spatial: num(r[2].text)!},
    }));
    if (rows.length !== 13) throw new Error(`V* expected 13 paper rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
