// InfiniteBench English QA: the README reports F1 on a 0–100 scale.
// Only exact En.QA scores are imported; a “less than 5%” bound is not treated as an exact score.
// Dataset reference-answer length is not model token usage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/OpenBMB/InfiniteBench/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "infinitebench-en-qa",
 url: "https://github.com/OpenBMB/InfiniteBench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=markdownTables(await fetchText(FEED)).find(t=>t[0].includes('YaRN-Mistral-7B'));
  const r=t?.find(r=>r[0]==='En.QA');if(!t||!r)throw new Error('InfiniteBench En.QA results missing');
  return t[0].slice(1).flatMap((model,i)=>/^\d/.test(r[i+1]??'')?[{model,score:num(r[i+1])!,setting:'En.QA; F1 (0–100)'}]:[]);
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
