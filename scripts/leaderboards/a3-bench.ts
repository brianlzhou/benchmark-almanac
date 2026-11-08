// A³-Bench published average accuracy for three memory paradigms. Token totals remain metrics because the source does not identify average output tokens per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://a3-bench.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "a3-bench",
  url: "https://a3-bench.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at a3-bench.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const html=await fetchText(FEED);const out:LeaderboardRow[]=[];let index=0;
    for(const t of tables(html)){const h=t[0]?.map(c=>c.text)??[];if(!h.includes('Avg. Acc (%)'))continue;const paradigm=['Oracle (expert anchors and attractors)','HybridRAG retrieval','Vanilla (no memory)'][index++];
      for(const r of t.slice(1)){const score=num(r[2]?.text);if(score===undefined)continue;const metrics:Record<string,number>={};for(let i=3;i<h.length;i++){const v=num(r[i]?.text);if(v===undefined)continue;metrics[h[i]==='Tokens'?'reportedTokenTotal':h[i]]=h[i]==='Tokens'?v*(/M/i.test(r[i].text)?1e6:/K/i.test(r[i].text)?1e3:1):v;}out.push({model:identity(r[1].text.replace(/[🥇🥈🥉]/gu,'').trim()),score,setting:paradigm,metrics});}
    }if(!out.length)throw new Error('A3 memory tables missing');return out;
  },
};
export default board;
