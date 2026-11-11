// SuperCLUE-Math6 combined reasoning score, on the published 0–100 scale.
// Reasoning level and the weighted reasoning/accuracy components remain separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://www.CLUEbenchmarks.com/superclue_math6.html";
const board: Leaderboard = {
 benchmark: "superclue-math6", url: "https://www.CLUEbenchmarks.com/superclue_math6.html", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 aliases: {'GPT_4_1106_Preview':'gpt-4-turbo-nov-2023'},
 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='推理步数 加权得分'));if(!t)throw new Error('Missing Math6 table');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){let model=r[0]?.text;const score=num(r[2]?.text);if(!model||score===undefined)continue;
 if(/^(GPT_4|GPT_35_Turbo|GPT_3\.5_Turbo)$/.test(model))model+=' [snapshot unspecified]';
 const metrics:Record<string,number>={};for(const [i,k] of [[1,'reasoning level'],[3,'weighted reasoning score'],[4,'accuracy score']] as const){const v=num(r[i]?.text);if(v!==undefined)metrics[k]=v;}rows.push({model,score,metrics});}return rows;
 },
};
export default board;
