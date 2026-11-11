// Anthropic's Chrome prompt-injection chart publishes exact attack-success percentages in image alt text.
// The adaptive Best-of-N attacker gets 100 attempts per environment. Safeguards configure the whole evaluation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
const PAGE = 'https://www.anthropic.com/research/prompt-injection-defenses';
const board:Leaderboard = {
  benchmark:'prompt-injection-adaptive-browser-use-anthropic',url:PAGE,feed:PAGE,
  terms:'Anthropic terms restrict automated extraction. Benchmark Almanac credits Anthropic and links the source.',
  async fetch() {
    const html=await fetchText(PAGE);
    const alt=[...html.matchAll(/alt="([^"]+)"/g)].map(m=>text(m[1])).find(s=>s.includes('Claude for Chrome Prompt Injection Robustness'));
    if(!alt)throw new Error('Anthropic prompt-injection chart description missing');
    const rows:LeaderboardRow[]=[];
    for(const m of alt.matchAll(/((?:Sonnet|Haiku|Opus)\s+[\d.]+):\s*([^:]+?)(?=(?:Sonnet|Haiku|Opus)\s+[\d.]+:|Sample sizes|$)/g)) {
      const values=[...m[2].matchAll(/([\d.]+)%/g)].map(x=>Number(x[1]));
      if(values.length!==3)throw new Error('Anthropic safeguard-condition percentages changed');
      values.forEach((score,i)=>rows.push({model:`Claude ${m[1]}`,score,setting:['model only','old safeguards','improved safeguards'][i],harness:'Claude for Chrome',metrics:{attackerAttemptsPerEnvironment:100}}));
    }
    if(rows.length<12)throw new Error('Anthropic model chart incomplete');
    return rows;
  },
};
export default board;
