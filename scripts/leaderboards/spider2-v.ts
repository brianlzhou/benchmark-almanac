// Spider2-V: All-task success percentage is the headline. Instruction and account splits
// remain metrics on the matching overall configuration. Preserve harness, cost, and tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import {mdTables} from './big-bench-extra-hard.ts';
const FEED = "https://spider2-v.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "spider2-v",
  url: "https://spider2-v.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at spider2-v.github.io; retain source attribution and follow the upstream terms.",
  aliases: {"GPT-4V (1106)": "gpt-4-turbo-nov-2023", "GPT-4o (0513)": "gpt-4o-may-2024"},
  
  async fetch() {
    const html=(await fetchText(FEED)).replace(/<!--[\s\S]*?-->/g,'');const out:LeaderboardRow[]=[];
    const readme=await fetchText('https://raw.githubusercontent.com/xlang-ai/Spider2-V/HEAD/README.md');
    const budget=mdTables(readme).find(t=>t.head.includes('Average Completion Tokens'));
    for(const m of html.matchAll(/<div title="([^"]+)"[^>]*id="BoardPanel\d+"[^>]*>([\s\S]*?)(?=<div title=|$)/g)){
      const t=tables(m[2]).find(t=>t[0]?.some(c=>c.text==='Score'));if(!t)continue;
      for(const r of t.slice(1)){const score=num(r[3]?.text);if(score===undefined)continue;let model=text(r[1].html.split(/<p\b/i)[0]);if(model==='Gemini-Pro-1.5')model='Gemini 1.5 Pro';
        const b=m[1]==='All'?budget?.rows.find(v=>model.startsWith(v[0])):undefined;const metrics:Record<string,number>={};const cost=b?num(b[4]):undefined;const tv=b?num(b[3]):undefined;if(b){const dur=num(b[1]);if(dur!==undefined)metrics.latency=dur*60;}
        out.push({model:identity(model),score,setting:m[1]+'; '+r[2].text,harness:r[2].html?text(r[2].html.split(/<p\b/i)[0]):undefined,cost,tokens:tv===undefined?undefined:tv*(/K/i.test(b![3])?1000:1),metrics});}
    }if(!out.length)throw new Error('Spider2-V score panels missing');
    const overall = out.filter(r => r.setting?.startsWith('All; '));
    for (const row of overall) {
      const config = row.setting!.slice(5);
      for (const sub of out) {
        const at = sub.setting?.indexOf('; ') ?? -1;
        if (at < 0 || sub === row || sub.model !== row.model || sub.setting!.slice(at + 2) !== config) continue;
        row.metrics![sub.setting!.slice(0, at).toLowerCase().replace(/-/g, '_')] = sub.score;
      }
      row.setting = config;
    }
    if (!overall.length) throw new Error('Spider2-V All rows missing');
    return overall;
  },
};
export default board;
