// ViVerBench overall verification accuracy. Fractions become percentages.
// Human and random references are excluded; sixteen category accuracies are retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://omniverifier.github.io/";
const board: Leaderboard = {
 benchmark: "viverbench", url: "https://omniverifier.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 aliases: {'OpenAI o3':'o3','OpenAI o4-mini':'o4-mini','OpenAI o1':'o1','InternVL3.5 A28B':'internvl3-5-241b-a28b'},
 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.[2]?.text==='Overall');if(!t)throw new Error('Missing verification table');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){let model=r[1]?.text.replace(/[🥇🥈🥉]/gu,'').replace(/\s*\(Ours\)/,'').trim();if(!model||/^(Human|Random)$/i.test(model))continue;const score=num(r[2]?.text);if(score===undefined)continue;
 if(model==='GPT-4o'||model==='Gemini 2.5 Pro')model+=' [snapshot unspecified]';
 const metrics:Record<string,number>={};for(let i=3;i<r.length;i++){const n=num(r[i].text);if(n!==undefined)metrics[t[0][i].text]=n*100;}rows.push({model,score:score*100,metrics});}return rows;
 },
};
export default board;
