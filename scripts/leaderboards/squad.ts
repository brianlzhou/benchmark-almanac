// SQuAD 1.1: F1 is the headline percentage; Exact Match remains a separate percentage metric.
// The table is identified by its 2016 human reference, keeping it separate from SQuAD 2.0.
// Single-model and ensemble configurations and submission dates are preserved.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://rajpurkar.github.io/SQuAD-explorer/";
const board: Leaderboard = {
 benchmark: "squad",
 url: "https://rajpurkar.github.io/SQuAD-explorer/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t.some(r=>r[1]?.text.includes("Rajpurkar et al. '16")));
  if(!t)throw new Error('SQuAD 1.1 table missing');
  return t.slice(1).filter(r=>!/^Human/i.test(r[1]?.text??'') && num(r[3]?.text)!==undefined).map(r=>{
    const label=text(r[1].html.split(/<p\b/)[0]);
    const config=label.match(/\s*\((single(?: model)?|ensemble)\)/i);
    const dateText=r[0].html.match(/class="date[^\"]*">([^<]+)/)?.[1];
    const date=dateText?new Date(dateText+' UTC'):undefined;
    return {model:label.replace(/\s*\((single(?: model)?|ensemble)\)/i,''),setting:'SQuAD 1.1'+(config?'; '+config[1]:''),score:num(r[3].text)!,
      date:date && Number.isFinite(date.getTime())?date.toISOString().slice(0,10):undefined,metrics:{exactMatch:num(r[2].text)!}};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
