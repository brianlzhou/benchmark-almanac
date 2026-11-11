// WiC: test accuracy is the percentage in four three-column result groups.
// Representation type and implementation source distinguish methods sharing a model name.
// The separate development tables, random reference and human reference are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://pilehvar.github.io/wic/";
const board: Leaderboard = {
 benchmark: "wic",
 url: "https://pilehvar.github.io/wic/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const ts=tables(await fetchText(FEED)).filter(t=>t[0]?.length===3 && /embeddings|representations|baselines/i.test(t[0][0].text));
  if(!ts.length)throw new Error('WiC test tables missing');
  return ts.flatMap(t=>t.slice(1).filter(r=>num(r[2]?.text)!==undefined).map(r=>({model:r[0].text.replace(/\s*†/g,''),setting:t[0][0].text,harness:r[1].text,score:num(r[2].text)!})));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
