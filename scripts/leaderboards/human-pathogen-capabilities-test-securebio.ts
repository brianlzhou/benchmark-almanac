// SecureBio's original HPCT chart reports raw accuracy in its hover text, in percent.
// Keep reasoning effort, refusal rates and accuracy intervals; deduplicate the chart's grouping traces.
// Exclude points the publisher flags as unreliable because of excessive refusals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { sbCharts, SB_PAGE, SB_TERMS, SB_ALIASES } from './hpct-v2-securebio.ts';
import { text } from '../lib/html.ts';
const board:Leaderboard={benchmark:'human-pathogen-capabilities-test-securebio',url:SB_PAGE,feed:SB_PAGE,terms:SB_TERMS,aliases:SB_ALIASES,async fetch(){
 const rows=new Map<string,LeaderboardRow>();
 for(const c of (await sbCharts()).filter(c=>/Model performance on HPCT$/.test(c.title)))for(const h of c.hovers){
  const lines=h.split(/<br\s*\/?\s*>/i).map(text).filter(Boolean);
  if(lines.some(l=>/too many refusals/i.test(l)))continue;
  const accuracy=lines.find(l=>l.startsWith('Accuracy:'))?.match(/Accuracy:\s*([\d.]+)%\s*\[([\d.]+)%,\s*([\d.]+)%\]/);
  if(!accuracy||!lines[0])continue;
  const name=lines[0].match(/^(.*?)\s*(?:\[([^\]]+)\])?$/)!;
  const model=name[1].trim(); const setting=name[2]??lines.find(l=>/^Reasoning(?: effort)?:/.test(l))?.split(':').slice(1).join(':').trim();
  const refusal=lines.find(l=>l.startsWith('Refusals:'))?.match(/([\d.]+)%/);
  rows.set(lines[0],{model,score:Number(accuracy[1]),setting,metrics:{ciLow:Number(accuracy[2]),ciHigh:Number(accuracy[3]),...(refusal?{refusalRate:Number(refusal[1])}:{})}});
 }
 if(!rows.size)throw new Error('No original HPCT accuracy rows');return [...rows.values()];
}};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
export default board;
