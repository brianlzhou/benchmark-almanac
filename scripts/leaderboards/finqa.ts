// FinQA public-test leaderboard score percentages under published submission usernames, whose model identities are not asserted. Keep the corrected FinQANet baseline separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://codalab.lisn.upsaclay.fr/competitions/1846";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "finqa",
  url: "https://codalab.lisn.upsaclay.fr/competitions/1846",
  feed: FEED,
  terms: "Public results published by the benchmark authors at codalab.lisn.upsaclay.fr; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Username'));if(!t)throw new Error('FinQA submissions missing');
    const out:LeaderboardRow[]=t.slice(1).flatMap(r=>{const score=num(r[2]?.text);return score===undefined?[]:[{model:'FinQA submission: '+r[1].text,score,setting:'Public-test competition 1846; submitted score'}];});
    const readme=await fetchText('https://raw.githubusercontent.com/czyssrs/FinQA/HEAD/README.md');
    const m=readme.match(/correct re(?:su|us)lts for (FinQANet-[\w-]+) should be ([\d.]+) execution accuracy and ([\d.]+) program accuracy/i);
    if(m)out.push({model:m[1],score:Number(m[2]),setting:'Corrected baseline; execution accuracy',metrics:{programAccuracy:Number(m[3])}});
    return out;
  },
};
export default board;
