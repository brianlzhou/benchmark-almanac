// SimpleQA: correctness percentage from the official simple-evals README. The repository is deprecated,
// but the importer reads its current head. Reasoning-effort configurations remain separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/openai/simple-evals/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "simpleqa",
 url: "https://github.com/openai/simple-evals",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const table = markdownTables(await fetchText(FEED)).find(t => t[0].includes('SimpleQA'));
  if (!table) throw new Error('SimpleQA table missing');
  const col = table[0].indexOf('SimpleQA');
  return table.slice(1).filter(r => num(r[col]) !== undefined).map(r => {
    let model = r[0].replace(/\s*\[\^\d+\]/g, '').trim();
    const effort = model.match(/-(high|low)$/);
    if (effort) model = model.slice(0, -effort[0].length);
    return {model, score: num(r[col])!, setting: effort?.[1] ?? (model==='o3-mini' ? 'medium' : undefined)};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
