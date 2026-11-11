// Toloka Arena: pass^5 is the registry’s headline reliability metric, in percent.
// Pass^1 is a supporting metric on that same whole-benchmark row; effort remains a setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://toloka.ai/blog/toloka-arena-independent-evaluation-of-agentic-intelligence/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "toloka-arena",
  url: "https://toloka.ai/blog/toloka-arena-independent-evaluation-of-agentic-intelligence/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at toloka.ai; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='pass^1'));if(!t)throw new Error('Toloka baseline table missing');const out:LeaderboardRow[]=[];
    for(const r of t.slice(1))for(let i=1;i<3;i++){const score=num(r[i]?.text);if(score!==undefined)out.push({model:identity(r[0].text.replace(/ \(xhigh\)$/i,'')),score,setting:'Launch baseline; '+t[0][i].text+(/xhigh/i.test(r[0].text)?'; xhigh reasoning':'')});}return out.filter(r=>r.setting?.includes('; pass^5')).map(r=>{
      const other=out.find(x=>x.model===r.model&&x.setting===r.setting!.replace('pass^5','pass^1'));
      return {...r,setting:r.setting!.replace('; pass^5',''),metrics:other?{'pass^1':other.score}:undefined};
    });
  },
};
export default board;
