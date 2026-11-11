// EXAMS overall multilingual accuracy percentage, retaining all language splits and excluding random/IR baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/mhardalov/exams-qa/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "exams-multilingual-qa",
 url: "https://github.com/mhardalov/exams-qa",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('All'));
  if (!t) throw new Error('exams-multilingual-qa table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/Random|^IR/i.test(r[0]) && num(r[17])!==undefined).map(r=>({
    model:/^w\//.test(r[0]) || /^then/.test(r[0]) ? 'XLM-R' : r[0].replace(/ on RACE| \(Full\)/g, ''),
    setting:/^w\//.test(r[0]) ? 'RACE + SciENs' : /^then/.test(r[0]) ? 'RACE + SciENs + EXAMS (Full)' : /Full/.test(r[0]) ? 'Full training' : 'RACE training', score:num(r[17])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==17 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('exams-multilingual-qa has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
