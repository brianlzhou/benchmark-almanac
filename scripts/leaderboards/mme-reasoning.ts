// MME-Reasoning overall accuracy percentages with capability and reasoning-type breakdowns.
// The -T suffix identifies thinking mode; undated API snapshots remain unmatched.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://alpha-innovator.github.io/mmereasoning.github.io/";
const board: Leaderboard = {
 benchmark: "mme-reasoning", url: "https://alpha-innovator.github.io/mmereasoning.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'Claude-4-Sonnet':'claude-sonnet-4','Seed1.5-VL':'seed-1-5-vl'},
 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.at(-1)?.text==='Acc.');if(!t)throw new Error('Missing MME reasoning table');const rows:LeaderboardRow[]=[];
for(const r of t.slice(2)){let model=r[1]?.text.replace(/[🥇🥈🥉]/gu,'').trim();const score=num(r.at(-1)?.text);if(!model||score===undefined)continue;
 const thinking=model.endsWith('-T');model=model.replace(/-T$/,'');if(/^(GPT-4o|Gemini-2\.5-Pro)$/.test(model))model+=' [snapshot unspecified]';
 const metrics:Record<string,number>={};for(let i=2;i<r.length-1;i++){const v=num(r[i].text);if(v!==undefined)metrics[t[1][i-2].text]=v;}
 rows.push({model,score,setting:thinking?'thinking':undefined,metrics});}return rows;
 },
};
export default board;
