// TextQuests' catalog record measures harmful actions per 100 steps, lower is better.
// The old importer read progress percentage instead, reversing the meaning of its lab safety result.
// Read the published harm value for the whole 25-game suite. Clue access is a whole-suite configuration.
// Progress and completed games remain metrics. The page discovers its current results bundle on every refresh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE='https://www.textquests.ai/';
const board:Leaderboard={benchmark:'textquests',url:PAGE,feed:PAGE+' (current page bundle, harm per 100 steps)',
 terms:'The public project page publishes these paper results. The TextQuests repository is MIT licensed.',
 async fetch(){
  const html=await fetchText(PAGE);
  const src=html.match(/\/_next\/static\/chunks\/app\/page-[\w]+\.js[^"]*/)?.[0];
  if(!src)throw new Error('TextQuests results bundle missing');
  await new Promise(r=>setTimeout(r,1100));
  const js=await fetchText(new URL(src,PAGE).href);
  const rows:LeaderboardRow[]=[];
  const pattern=/\{model:"([^"]+)",noClues:\{progress:([\d.]+),completed:(\d+),harm:([\d.]+)\},withClues:\{progress:([\d.]+),completed:(\d+),harm:([\d.]+)\}/g;
  for(const m of js.matchAll(pattern)){
   const name=m[1];
   const model=/^(?:GPT-4o|Gemini 2.5 (?:Pro|Flash|Flash-Lite)|Kimi K2|DeepSeek (?:R1|V3))$/i.test(name)?name+' (snapshot unspecified)':name;
   for(const [offset,setting] of [[2,'no clues'],[5,'with clues']] as const)
    rows.push({model,score:Number(m[offset+2]),setting,metrics:{progress:Number(m[offset]),completedGames:Number(m[offset+1])}});
  }
  if(!rows.length)throw new Error('No TextQuests harm scores');
  return rows;
 }};
export default board;
