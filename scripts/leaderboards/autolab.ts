// AutoLab current release: the rendered overall Avg@3 is the headline score.
// Best@3 and up to 23 task-detail scores remain metrics, never competing headline rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://autolab.moe/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "autolab",
  url: "https://autolab.moe/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at autolab.moe; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const html=await fetchText(FEED);const out:LeaderboardRow[]=[];
    const section=html.slice(html.indexOf('Avg@3'),html.indexOf('Task Detail Scores'));
    for(const m of section.matchAll(/<span class="truncate[^>]*>([^<]+)<\/span>([\s\S]*?)(?=<span class="truncate|$)/g)){
      const avg=m[2].match(/text-lg leading-none"[^>]*>([\d.]+)<\/span>/)?.[1];const best=m[2].match(/↗(?:<!-- -->)?([\d.]+)/)?.[1];
      if(avg)out.push({model:identity(text(m[1])),score:Number(avg),setting:'Current release; Overall Avg@3'});
      if(best)out.push({model:identity(text(m[1])),score:Number(best),setting:'Current release; Overall Best@3'});
    }
    const t=tables(html).find(t=>t[0]?.[0]?.text==='Task');if(t)for(const r of t.slice(1)){if(r.length!==t[0].length)continue;for(let i=1;i<r.length;i++){const score=num(r[i].text);if(score!==undefined)out.push({model:identity(t[0][i].text),score,setting:'Current release; task detail: '+r[0].text});}}
    if(!out.some(r=>r.setting?.includes('Overall Avg@3')))throw new Error('AutoLab aggregate rows missing');
    return out.filter(r=>r.setting==='Current release; Overall Avg@3').map(r=>{
      const metrics:Record<string,number>={};
      for(const other of out.filter(x=>x.model===r.model&&x!==r)){
        const key=other.setting==='Current release; Overall Best@3'?'best@3':other.setting!.replace('Current release; task detail: ','').toLowerCase().replace(/[^a-z0-9]+/g,'_');
        if(Object.keys(metrics).length<24)metrics[key]=other.score;
      }
      return {...r,setting:undefined,metrics};
    });
  },
};
export default board;
