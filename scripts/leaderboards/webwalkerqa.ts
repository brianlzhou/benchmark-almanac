// WebWalkerQA: Overall accuracy covers single-source and multi-source questions. Average actions remain a metric.
// Agent methods run the entire question set. Commercial systems retain their names without inferred backbone aliases.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2501.07572";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "webwalkerqa",
  url: "https://tongyi-agent.github.io/blog/introducing-tongyi-deep-research/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const ts=await paperTables(FEED),t=ts[2];if(!t?.[0]?.some(c=>c.text==='Overall'))throw new Error('WebWalkerQA table changed');
    const rows:LeaderboardRow[]=[];let model='';
    for(let r of t){if(r.length===16){model=paperModel(r[0].text.replace(/ -/g,'-'));if(model==='Qwen-Plus')model+=' (snapshot unspecified)';r=r.slice(1);}
      if(r.length!==15||num(r[13].text)===undefined)continue;rows.push({model,harness:r[0].text,score:num(r[13].text)!,metrics:{averageActions:num(r[14].text)!}});}
    let group='';for(const r of ts[3]){if(r.length===1){group=r[0].text;continue;}if(r.length!==8||num(r[7].text)===undefined)continue;
      let model=paperModel(r[0].text);if(['Doubao','Kimi','Tongyi','Gemini-Search','Naive RAG','MindSearch'].includes(model))model+=' (paper system, backbone unspecified)';
      rows.push({model,score:num(r[7].text)!,setting:group.includes('Close Book')?'closed book':'retrieval system'});}
    if(rows.length!==27)throw new Error('WebWalkerQA expected 27 configurations');return rows;
  },
};
export default board;
