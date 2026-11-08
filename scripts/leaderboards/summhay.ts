// Summary of a Haystack: Joint Score is the headline whole-benchmark score. Coverage and citation scores remain metrics.
// Each retrieval method and the full-context condition run the same benchmark. Oracle retrieval is labeled explicitly.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2407.01370";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "summhay",
  url: "https://github.com/salesforce/summary-of-a-haystack",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[1];
    if(!t?.[0]?.some(c=>c.text.includes('Joint Score'))) throw new Error('SummHay table changed');
    const names=['random retrieval','vector retrieval','LongEmbed retrieval','keyword retrieval','Cohere Rerank 3 retrieval','oracle retrieval','full context'];
    const rows:LeaderboardRow[]=[];
    for(const r of t.slice(2)) {
      if(r.length!==23 || r[0].text.startsWith('Human')) continue;
      let model=paperModel(r[0].text.replace(/\s+width \d+pt/g,''));
      if(/^Command-r/i.test(model)) model+=' (paper 2024 snapshot)';
      if(model==='GPT3.5') model='GPT-3.5 (snapshot unspecified)';
      for(let j=0;j<7;j++) {
        const clean=(i:number)=>num(r[i].text.replace(/\s+width \d+pt/g,''));
        const score=clean(15+j); if(score===undefined)continue;
        rows.push({model,score,setting:names[j],metrics:{coverage:clean(1+j)!,citation:clean(8+j)!}});
      }
    }
    if(rows.length!==69)throw new Error('SummHay expected 69 configurations');return rows;
  },
};
export default board;
