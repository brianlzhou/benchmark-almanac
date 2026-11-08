// ChineseQA: DeepSeek LLM repository results for its in-house question-answering test, in percent.
// Read the ChineseQA column from the base and chat tables, retaining 5-shot evaluation and distinct
// base/chat identities. Deduplicate the repeated DeepSeek base rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/deepseek-ai/DeepSeek-LLM/main/README.md";
const board: Leaderboard = {
 benchmark: "chineseqa", url: "https://raw.githubusercontent.com/deepseek-ai/DeepSeek-LLM/main/README.md", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const rows=new Map<string,LeaderboardRow>();
for(const t of mdTables(await fetchText(FEED))){const i=t.head.findIndex(h=>h.replace(/\s/g,'')==='ChineseQA');if(i<0)continue;for(const r of t.rows){if(!r[0])continue;const score=num(r[i]);if(score===undefined)continue;let model=r[0].replace(/\s+/g,' ').replace(/\s+-/g,'-').trim();if(/^LLaMA-2/.test(model))model+=' Base';const old=rows.get(model);if(old&&old.score!==score)throw new Error('Conflicting ChineseQA scores');rows.set(model,{model,score,setting:'5-shot'});}}
if(!rows.size)throw new Error('ChineseQA results missing');return [...rows.values()];
 },
};
export default board;
