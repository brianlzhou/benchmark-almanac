// USACO: whole-set pass@1 in percent on 307 problems. Section 3.1 names the exact GPT snapshots.
// Zero-shot and seven inference methods evaluate the full set. The separate human-tutoring subset is excluded.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2404.10952";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "usaco",
  url: "https://princeton-nlp.github.io/USACOBench/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const ts=await paperTables(FEED);if(!ts[4]?.[0]?.some(c=>c.text==='Pass@1'))throw new Error('USACO baseline table changed');
    const names:Record<string,string>={'CodeLlama (7B)':'CodeLlama-7B-Instruct','DeepSeek Coder (7B)':'DeepSeek-Coder-Instruct-7B','GPT-3.5':'gpt-3.5-turbo-1106','GPT-4':'gpt-4-1106-preview','Claude-3-Sonnet':'claude-3-sonnet-20240229'};
    const rows:LeaderboardRow[]=ts[4].filter(r=>names[r[0]?.text]).map(r=>({model:names[r[0].text],score:num(r[1].text)!,setting:'Zero-shot'}));
    for(const r of ts[5].slice(2)){if(r.length!==3||num(r[1].text)===undefined)continue;for(let i=1;i<=2;i++)rows.push({model:names[i===1?'GPT-3.5':'GPT-4'],score:num(r[i].text)!,setting:r[0].text});}
    if(rows.length!==19)throw new Error('USACO expected 19 configurations');return rows;
  },
};
export default board;
