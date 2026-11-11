// HorizonMath: full-dataset solve rate in percent, read from the percentage in each fraction cell.
// Keep calibration success and accepted unsolved-tier solutions as metrics. Split explicit reasoning
// effort and Codex harness labels from the published model/configuration names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://ewang26.github.io/HorizonMath/";
const board: Leaderboard = {
 benchmark: "horizonmath", url: "https://ewang26.github.io/HorizonMath/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.[0]?.text==='Model / configuration');if(!t)throw new Error('HorizonMath results missing');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){const m=r[1]?.text.match(/(\d+)\/(\d+)\s*\(([\d.]+)%\)/);if(!m)continue;let model=r[0].text;const harness=/\(Codex\)/i.test(model)?'Codex':undefined;model=model.replace(/\s*\(Codex\)/i,'');const effort=model.match(/\s+(max|xhigh|high|medium|low)$/i);if(effort)model=model.slice(0,effort.index);rows.push({model,score:Number(m[3]),harness,setting:effort?.[1].toLowerCase(),metrics:{solved:Number(m[1]),problems:Number(m[2]),calibrationSolved:num(r[2].text)!,unsolvedTierSolutions:num(r[3].text)!}});}
return rows;
 },
};
export default board;
