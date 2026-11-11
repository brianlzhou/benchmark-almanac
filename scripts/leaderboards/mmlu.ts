// MMLU: the authors’ README reports test accuracy, in percent. Average is the headline score;
// Subject-group accuracies are metrics. Parameter count identifies the model; prompting is the setting.
// Random is excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/hendrycks/test/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "mmlu",
 url: "https://github.com/hendrycks/test",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const table = markdownTables(await fetchText(FEED)).find(t => t[0].includes('Average'));
  if (!table) throw new Error('MMLU table missing');
  return table.slice(1).filter(r => !/random/i.test(r[0]) && num(r[6]) !== undefined).map(r => {
    const parts = r[0].match(/^(.*?)\s*\((.*)\)$/);
    const config=parts?.[2]?.split(',').map(s=>s.trim())??[];
    const size=config.find(s=>/^[\d.]+B$/.test(s));
    return {model: parts ? parts[1]+(size?' '+size:'') : r[0], setting: config.filter(s=>s!==size).join(', ')||undefined, score: num(r[6])!, metrics: Object.fromEntries([2,3,4,5].map(i => [table[0][i], num(r[i])!]))};
  });
 },
};
export default board;
