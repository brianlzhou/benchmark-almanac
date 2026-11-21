// TruthfulQA-Multi evaluates truthfulness in English, Spanish, Catalan, Galician and Basque.
// The paper's Table 4 reports a multilingual average for MC2 and Judge-LLM scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { tables, num } from '../lib/html.ts';
const FEED='https://arxiv.org/html/2502.09387';
const board: Leaderboard={benchmark:'truthfulqa-multi',static:'paper',url:FEED,feed:FEED,terms:'arXiv permits these HTML paths under robots.txt. Results are attributed to the paper authors.',parts:{mc2:{name:'MC2',group:'Metric'},judge:{name:'Judge-LLM',group:'Metric'}},async fetch(){const ts=tables(await paperHtml(FEED));const t=ts[3];if(!t)throw new Error('Missing TruthfulQA-Multi table');const out:LeaderboardRow[]=[];for(const r of t.slice(2)){const model=r[0]?.text.trim();const mc=num(r[6]?.text??'');const judge=num(r[12]?.text??'');if(!model||mc===undefined||judge===undefined||/Average$/.test(model))continue;out.push({model,score:mc,metrics:{judge}})}if(out.length<2)throw new Error('Too few TruthfulQA-Multi rows');return out;}};export default board;
