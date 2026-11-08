// LoCoMo: Overall answer-prediction F1 is the paper's headline question-answering evaluation.
// Context budgets and retrieval choices apply to the entire QA set. Category F1 and retrieval recall remain metrics.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2402.17753";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "locomo",
  url: "https://snap-research.github.io/locomo/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const ts=await paperTables(FEED), t=ts[1];
    if(!t?.[0]?.some(c=>c.text==='Answer Prediction (F1)')) throw new Error('LoCoMo QA table changed');
    const rows:LeaderboardRow[]=[]; let model='',group='';
    for(let r of t.slice(3)) {
      if(r.length===9){group=r[0].text;r=r.slice(1);}
      if(r.length===8){model=paperModel(r[0].text);r=r.slice(1);}
      if(r.length!==7)continue;
      rows.push({model,score:num(r[6].text)!,setting:group+', context '+r[0].text,metrics:{singleHop:num(r[1].text)!,multiHop:num(r[2].text)!,temporal:num(r[3].text)!,openDomain:num(r[4].text)!,adversarial:num(r[5].text)!}});
    }
    let unit='';
    for(const r of ts[2].slice(3)) {
      if(r.length!==14)continue;if(r[0].text)unit=r[0].text;
      rows.push({model:'GPT-3.5-turbo-16K (snapshot unspecified)',score:num(r[7].text)!,harness:'DRAGON RAG',setting:unit+' top-'+r[1].text,metrics:{retrievalRecall:num(r[13].text)!}});
    }
    if(rows.length!==19)throw new Error('LoCoMo expected 19 rows');return rows;
  },
};
export default board;
