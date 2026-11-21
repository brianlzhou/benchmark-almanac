// The full 900-case v0.3 headline, prompt 4aj only, as in the README. Excludes sensitivity analyses.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = "https://raw.githubusercontent.com/cortico-health/MedSafe-Dx/HEAD/results/v03_full/scores.json";
type Value = {value:number;ci:[number,number]};
const board: Leaderboard = {
 benchmark:'medsafe-dx-0-3', url:'https://github.com/cortico-health/MedSafe-Dx', feed:FEED,
 terms:'CC BY-NC-ND 4.0 repository; factual headline results are attributed in their published units; raw.githubusercontent.com has no robots.txt.',
 stats:{underEscalation:{name:'Under-escalation rate',unit:'%',better:'lower'},overEscalation:{name:'Over-escalation rate',unit:'%',better:'lower'}},
 async fetch() {
  const d = await fetchJson<{headline_within_condition:{headline_cases:number;rows:Record<string,Record<string,Value>>}}>(FEED);
  if(d.headline_within_condition.headline_cases !== 900) throw new Error('v0.3 case count changed');
  const rows=Object.entries(d.headline_within_condition.rows).filter(([k])=>k.endsWith('|4aj')).map(([key,r])=>({
   model:key.split('|')[0], setting:'v0.3 full, prompt 4aj', score:r.score_z_bal.value,
   metrics:{ciLow:r.score_z_bal.ci[0],ciHigh:r.score_z_bal.ci[1],underEscalation:r.U.value,overEscalation:r.O.value}
  }));
  if(rows.length<3)throw new Error('No v0.3 headline rows');return rows;
 }
};
export default board;
