// Pantograph evaluates Astra and Fable on eight Pandroid manipulation tasks at low effort.
// Use the published Overall full-success fraction, converted to percent, with its interval and trial counts.
// Individual manipulation tasks remain metrics on the overall row.
// The shared harness has a 20-minute or 96-turn budget. Human references are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

const FEED = "https://pantograph.com/journal/vlm-harness";
const board: Leaderboard = {
 benchmark: "pantograph-frontier-llm-robot-benchmark-pandroid", url: "https://pantograph.com/journal/vlm-harness", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const s=nextFlight(await fetchText(FEED));const d=jsonAfter<Record<string,any>>(s,'"scores":');const rows:LeaderboardRow[]=[];for(const task of Object.values(d))for(const [id,model] of [['astra','GPT-6 Astra'],['fable','Claude Fable 5.1']]){const r=task.scores[id];if(!r)continue;rows.push({model,harness:'Pantograph Pandroid',score:r.mean*100,setting:`${task.label}; low; 20 minutes or 96 turns`,metrics:{successes:r.successes,trials:r.environmentCount,ciLow:r.ciLow*100,ciHigh:r.ciHigh*100}});}if(!rows.length)throw new Error('No robot results');
return rows.filter(r => r.setting!.startsWith('Overall; ')).map(r => ({...r,
 setting:r.setting!.replace('Overall; ',''), metrics:{...r.metrics,...Object.fromEntries(rows
  .filter(x => x.model===r.model && !x.setting!.startsWith('Overall; '))
  .map(x => [x.setting!.split('; ')[0].toLowerCase().replace(/[^a-z0-9]+/g,'_'),x.score]))}}));
 },
};
export default board;
