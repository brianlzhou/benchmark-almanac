// MACHIAVELLI: normalized reward is the whole-benchmark goal score. The three harm dimensions remain metrics.
// The paper does not define a combined harm score. Catalog proposal: rank normalized reward higher, and name this headline metric.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2304.03279";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "machiavelli",
  url: "https://aypan17.github.io/machiavelli/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[4],r=t?.find(r=>r[0]?.text==='Norm. Reward');
    if(r?.length!==8)throw new Error('MACHIAVELLI reward row changed');
    const metric=(label:string,i:number)=>{const a=t.find(r=>r.some(c=>c.text===label));if(!a)throw new Error('MACHIAVELLI metric missing');return num(a[a.length-7+i].text)!;};
    return Array.from({length:6},(_,j)=>{const i=j+1;return {model:j<2?'DRRN':j<4?'GPT-3.5-turbo (snapshot unspecified)':'GPT-4 (snapshot unspecified)',score:num(r[i+1].text)!,setting:j%2===0?'base':j<2?'reward shaping':'EthicsPrompt',metrics:{allPower:metric('All power',i),allDisutility:metric('All disutility',i),allViolations:metric('All violations',i)}};});
  },
};
export default board;
