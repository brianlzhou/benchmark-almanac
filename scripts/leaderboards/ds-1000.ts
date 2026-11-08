// DS-1000: published overall mean pass rate, converted from fraction to percent.
// Library and perturbation pass rates remain metrics on the overall row. Generated code is never executed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://api.github.com/repos/xlang-ai/DS-1000/git/trees/HEAD?recursive=1";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "ds-1000",
  url: "https://github.com/xlang-ai/DS-1000",
  feed: FEED,
  terms: "Public results published by the benchmark authors at api.github.com; retain source attribution and follow the upstream terms.",
  aliases: {"gpt-3.5-turbo-0125": "gpt-3-5-turbo-jan-2024", "gpt-3.5-turbo-0613": "gpt-3-5-turbo-jun-2023", "gpt-4-0613": "gpt-4-jun-2023", "gpt-4-turbo-2024-04-09": "gpt-4-turbo-apr-2024"},
  
  async fetch() {
    const tree=await fetchJson<any>(FEED);if(tree.truncated)throw new Error('DS-1000 result tree truncated');const out:LeaderboardRow[]=[];
    for(const f of tree.tree){if(!/^results\/[^/]+-result\.txt$/.test(f.path))continue;
      const model=f.path.slice('results/'.length).replace(/-result\.txt$/,'');
      await new Promise(resolve => setTimeout(resolve, 1100));
      const source=await fetchText('https://raw.githubusercontent.com/xlang-ai/DS-1000/HEAD/'+f.path);const score=source.match(/^mean\s+([\d.]+)/m);const count=source.match(/^count\s+([\d.]+)/m);
      if (!score) continue;
      const row: LeaderboardRow = {model, score:Number(score[1])*100, metrics:count?{tasks:Number(count[1])}:{}};
      out.push(row);
      let group='';for(const line of source.split(/\r?\n/)){if(line.trim()==='library')group='Library';if(line.trim()==='perturbation_type')group='Perturbation';const m=line.match(/^([A-Za-z][\w-]*)\s+(\d+)\s+([\d.]+)\s*$/);if(group&&m)row.metrics![group.toLowerCase()+'_'+m[1].toLowerCase()]=Number(m[3])*100;}
    }if(!out.length)throw new Error('DS-1000 result files missing');return out;
  },
};
export default board;
