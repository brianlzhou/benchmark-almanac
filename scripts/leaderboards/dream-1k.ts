// DREAM-1K: Overall F1 is the video-captioning score expressed as a percentage.
// Overall precision/recall, five source-category triples, frame budgets and evaluation dates remain attached.
// Parameter count identifies a model variant, while frame sampling is the run setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://tarsier-vlm.github.io/";
const board: Leaderboard = {
 benchmark: "dream-1k",
 url: "https://tarsier-vlm.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Overall (%)'));
  if(!t)throw new Error('DREAM-1K table missing');
  return t.slice(2).filter(r=>num(r[5]?.text)!==undefined && !/human|random/i.test(r[1]?.text??'')).map(r=>({
    model:[text(r[1].html.split(/<p\b/)[0]), /B$/i.test(r[2].text) && !/\d+(?:\.\d+)?B\b/i.test(text(r[1].html.split(/<p\b/)[0])) ? r[2].text : ''].filter(Boolean).join(' '),score:num(r[5].text)!,setting:`frames=${r[3].text}`,
    date:/^\d{4}\/\d\d\/\d\d$/.test(r[4].text)?r[4].text.replaceAll('/','-'):undefined,
    metrics:Object.fromEntries(['overall','LM','AM','ST','YT','TT'].flatMap((h,i)=>['F1','P','R'].map((m,j)=>[h+m,num(r[5+i*3+j]?.text)])).filter((p):p is [string,number]=>typeof p[1]==='number'))
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
