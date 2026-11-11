// GDPevo accuracy percentages for base, few-shot, self-learning and reflection settings. Tool usage and relative cost changes remain metrics; the source does not publish dollar costs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/Prism-Shadow/GDPevo/main/README.md";
const board: Leaderboard = {
 benchmark: "gdpevo",
 url: "https://github.com/Prism-Shadow/GDPevo",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const t=markdownTables(await fetchText(FEED)).find(t=>t[0].includes('base acc'))!;return t.slice(1).flatMap(r=>['base','fewshot','self','reflect-3'].map((mode,i)=>({model:/^Opus/.test(r[1])?'Claude '+r[1]:r[1],score:num(r[3+i])!,harness:r[0],setting:r[2]+'; '+mode,metrics:{rounds:num(r[7+i*2])!,toolCalls:num(r[8+i*2])!,...(i?{costChangePercent:num(r[14+i])!,liftPoints:num(r[17+i])!}:{})}})));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
