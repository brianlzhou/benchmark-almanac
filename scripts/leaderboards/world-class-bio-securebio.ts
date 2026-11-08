// World Class Bio (WCB): raw accuracy percentages come from the official Plotly hover data,
// not the normalized trend axis. Reasoning-token budgets are configuration limits, not measured output usage.
// Confidence intervals, refusal rates and release dates remain attached; duplicated chart traces are collapsed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { sbCharts, SB_ALIASES } from './hpct-v2-securebio.ts';
const FEED = "https://securebio.org/benchmarks/details/";
const board: Leaderboard = {
 benchmark: "world-class-bio-securebio",
 url: "https://securebio.org/benchmarks/details/?benchmark=abc-bench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 aliases: Object.fromEntries(Object.entries(SB_ALIASES).filter(([name])=>name!=='Gemini 2.5 Flash')),
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const charts=(await sbCharts()).filter(c=>/Model performance on WCB$/.test(c.title));
  if(!charts.length)throw new Error('WCB chart missing');
  const rows=new Map<string,LeaderboardRow>();
  for(const h of charts.flatMap(c=>c.hovers)){
    const lines=h.split(/<br>/i).map(text).filter(Boolean);const s=lines.find(l=>l.startsWith('Accuracy:'))?.match(/Accuracy:\s*([\d.]+)%\s*\[([\d.]+)%,\s*([\d.]+)%\]/);
    if(!s||lines.some(l=>/too many refusals/i.test(l)))continue;
    const m=lines[0].match(/^(.*?)\s*(?:\[([^\]]+)\])?$/)!;
    const budget=num(lines.find(l=>l.startsWith('Reasoning budget:')));
    const refusal=num(lines.find(l=>l.startsWith('Refusals:')));
    rows.set(lines[0],{model:m[1].trim(),setting:m[2]??lines.find(l=>l.startsWith('Reasoning:'))?.slice(10).trim(),
      date:lines.find(l=>l.startsWith('Released:'))?.slice(9).trim(),score:Number(s[1]),
      metrics:{ciLow:Number(s[2]),ciHigh:Number(s[3]),...(budget!==undefined?{reasoningBudget:budget}:{}),...(refusal!==undefined?{refusals:refusal}:{})}});
  }
  return [...rows.values()];
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
