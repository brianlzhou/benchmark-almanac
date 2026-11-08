// MMBench-Video: OpenCompass reports Overall on the benchmark's native score scale. Preserve frame
// sampling, evaluation dates and all category scores from the live video leaderboard JSON.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='http://opencompass.openxlab.space/utils/video_leaderboard.json';
const board:Leaderboard={benchmark:'mmbench-video',url:'https://rank.opencompass.org.cn/leaderboard-multimodal',feed:FEED,terms:'Public OpenCompass leaderboard file, subject to project and host terms.',
async fetch(){const {results}=await fetchJson<{results:Record<string,{META?:{Method?:string[];Frames?:string;Time?:string};'MMBench-Video'?:Record<string,number>}>}>(FEED);const rows:LeaderboardRow[]=[];
for(const [id,e] of Object.entries(results)){const m=e['MMBench-Video'];if(typeof m?.Overall!=='number')continue;rows.push({model:e.META?.Method?.[0]??id,score:m.Overall,setting:e.META?.Frames?`${e.META.Frames} frames`:undefined,date:e.META?.Time?.replace(/\//g,'-'),metrics:Object.fromEntries(Object.entries(m).filter(([k,v])=>k!=='Overall'&&typeof v==='number'))});}if(!rows.length)throw new Error('No MMBench-Video scores');return rows;}};
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
export default board;
