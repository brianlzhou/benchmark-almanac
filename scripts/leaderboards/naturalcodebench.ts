// NaturalCodeBench: the main table's NCB Total Score combines the language and programming-language results.
//  Model-size continuation rows inherit their named family. Four subsets and two language totals remain metrics.
//  These are static paper results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2405.04520";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "naturalcodebench",
  url: "https://github.com/THUDM/NaturalCodeBench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED)).find(t => t[0]?.some(c => c.text === 'NCB Total'));
    if (!t) throw new Error('NaturalCodeBench main table missing');
    let family = '';
    const out: LeaderboardRow[] = [];
    for (let r of t) {
      if (r.length === 13 && num(r[8]?.text) !== undefined) family = r[0].text;
      else if (r.length === 12 && /^\d+(\.\d+)?B$/.test(r[0].text)) r = [{...r[0],text:family},...r];
      else continue;
      const model = paperModel(r[0].text + (r[1].text === 'N/A' ? '' : ` ${r[1].text}`));
      out.push({model, score:num(r[8].text)!, metrics:{zhPython:num(r[2].text)!,zhJava:num(r[3].text)!,zh:num(r[4].text)!,enPython:num(r[5].text)!,enJava:num(r[6].text)!,en:num(r[7].text)!}});
    }
    if (out.length !== 39) throw new Error(`NaturalCodeBench expected 39 rows, found ${out.length}`);
    return out;
  },
};
export default board;
