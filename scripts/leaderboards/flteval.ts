// FLTEval: the article’s Score is the headline measure. Cost is the price of the whole run,
// so costPer marks it as a whole-run cost; runCost is retained for the existing chart. The article identifies Claude snapshots explicitly.
// Use pass@1 for the headline score. Higher pass@k scores and run costs remain metrics.
// Preserve the Mistral Vibe scaffold and the score-versus-cost chart for pass@1 runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://mistral.ai/news/leanstral/";
const board: Leaderboard = {
 benchmark: "flteval",
 costPer: 'run',
 url: "https://mistral.ai/news/leanstral/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 aliases:{Haiku:'claude-haiku-4-5',Sonnet:'claude-sonnet-4-6',Opus:'claude-opus-4-6'},
 chart:{title:'FLTEval score versus run cost',x:{key:'runCost',label:'Total run cost',unit:'$',better:'lower'},y:{key:'score',label:'FLTEval score',unit:'score',better:'higher'},note:'Cost covers the whole evaluation run, not one task.'},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Cost ($)'));
  if(!t)throw new Error('FLTEval cost table missing');
  return t.slice(1).filter(r=>num(r[2]?.text)!==undefined).map(r=>{
    const pass=r[0].text.match(/\s+(pass@\d+)$/);
    return {model:r[0].text.replace(/\s+pass@\d+$/,''),setting:pass?.[1]??'pass@1',harness:'Mistral Vibe',
      score:num(r[2].text)!,metrics:{runCost:num(r[1].text)!}};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.filter(r => r.setting === 'pass@1').map(r => ({...r,setting:undefined,cost:r.metrics!.runCost,
    metrics:{...r.metrics,...Object.fromEntries(result.filter(x => x.model===r.model && x.setting!=='pass@1')
      .flatMap(x => [[x.setting!,x.score],[`${x.setting}_cost`,x.metrics!.runCost]]))}, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
