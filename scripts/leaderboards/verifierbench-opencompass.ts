// VerifierBench tests whether models verify mathematical, reasoning, knowledge and science answers.
// The paper's main table reports average accuracy and F1 across four categories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts'; import { tables, num } from '../lib/html.ts';
const FEED='https://arxiv.org/html/2508.03686';
const board:Leaderboard={benchmark:'verifierbench-opencompass',static:'paper',url:FEED,feed:FEED,terms:'arXiv permits these HTML paths under robots.txt. Results are attributed to the paper authors.',async fetch(){const ts=tables(await paperHtml(FEED));const t=ts[1];if(!t)throw new Error('Missing VerifierBench main table');const out:LeaderboardRow[]=[];for(const r of t.slice(2)){const model=r[0]?.text.trim();const score=num(r[9]?.text??'');const f1=num(r[10]?.text??'');if(!model||score===undefined||f1===undefined||/^(General LLMs|Verifier Models|CompassVerifiers)$/.test(model))continue;out.push({model,score,metrics:{f1}})}if(out.length<2)throw new Error('Too few VerifierBench rows');return out;}};export default board;
