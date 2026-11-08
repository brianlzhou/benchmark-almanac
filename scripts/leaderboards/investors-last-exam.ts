// Investor’s Last Exam published overall score, with forecast and simulated portfolio measures retained as metrics. Portfolio returns are not substituted for benchmark score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/Prophetlab/Investor-Last-Exam/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "investors-last-exam",
  url: "https://github.com/Prophetlab/Investor-Last-Exam",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const ts=mdTables(await fetchText(FEED));const main=ts.find(t=>t.head.includes('Overall'));if(!main)throw new Error('Investor leaderboard missing');
    const portfolio=ts.find(t=>t.head.includes('Cumulative return'));
    return main.rows.map(r=>{const metrics:Record<string,number>={};for(let i=2;i<main.head.length;i++){const v=num(r[i]);if(v!==undefined)metrics[main.head[i]]=v;}
      const port=portfolio?.rows.find(v=>v[0]===r[0]);if(port&&portfolio)for(let i=1;i<port.length;i++){const v=num(port[i]);if(v!==undefined)metrics[portfolio.head[i]]=v;}
      return {model:identity(r[0]),score:num(r[1])!,metrics};}).filter(r=>Number.isFinite(r.score));
  },
};
export default board;
