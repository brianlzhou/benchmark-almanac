// Qwen-Image-Bench: published Overall is the headline score on the native scale.
// The five scoring dimensions remain metrics on that overall row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import {mdTables} from './big-bench-extra-hard.ts';
const FEED = "https://huggingface.co/datasets/Qwen/Qwen-Image-Bench/raw/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "qwen-image-bench",
  url: "https://github.com/QwenLM/Qwen-Image-Bench",
  feed: FEED,
  terms: "Official results from the Qwen dataset card on Hugging Face. The almanac credits and links the source.",
  aliases: {},
  
  async fetch() {
    const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Creative Generation'));if(!t)throw new Error('Qwen image scores missing');const out:LeaderboardRow[]=[];
    const modelAt=t.head.indexOf('Model');if(modelAt<0)throw new Error('Qwen model column missing');
    for(const r of t.rows)for(let i=modelAt+1;i<t.head.length;i++){const score=num(r[i]);if(score!==undefined)out.push({model:identity(r[modelAt]),score,setting:t.head[i]});}return out.filter(r=>r.setting==='Overall').map(r=>({...r,setting:undefined,
      metrics:Object.fromEntries(out.filter(x=>x.model===r.model&&x!==r).map(x=>[x.setting!.toLowerCase().replace(/[^a-z0-9]+/g,'_'),x.score]))}));
  },
};
export default board;
