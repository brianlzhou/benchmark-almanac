// EdgeBench: use scores on all 134 tasks at each published time budget.
// The released 51-task subset is excluded. Category scores at 12 hours remain metrics on that run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import {mdTables} from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/ByteDance-Seed/EdgeBench/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "edgebench",
  url: "https://github.com/ByteDance-Seed/EdgeBench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {'DS-V4-Pro': 'deepseek-v4-pro'},
  
  async fetch() {
    const out:LeaderboardRow[]=[];
    for(const t of mdTables(await fetchText(FEED))){if(t.head[0]!=='Model')continue;for(const r of t.rows)for(let i=1;i<t.head.length;i++){const score=num(r[i]);if(score===undefined)continue;out.push({model:identity(r[0]),score,setting:t.heading+'; '+(t.head[i].startsWith('@')?t.head[i]:'@12h; '+t.head[i])});}}
    if(!out.length)throw new Error('EdgeBench tables missing');
    return out.filter(r => /^Full Benchmark.*; @\d+h$/.test(r.setting!)).map(r => ({...r,
      setting:r.setting!.split('; ')[1],
      ...(r.setting!.endsWith('@12h') ? {metrics:Object.fromEntries(out.filter(x => x.model===r.model &&
        x.setting!.startsWith('Full Benchmark') && x.setting!.includes('; @12h; '))
        .map(x => [x.setting!.split('; ')[2].toLowerCase().replace(/[^a-z0-9]+/g,'_'),x.score]))} : {})}));
  },
};
export default board;
