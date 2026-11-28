// Read test accuracy, the four subject groups, paper links, parameter counts, and prompting settings from the authors’ README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { withKaggle } from '../lib/boards/kaggle.ts';

const FEED = "https://raw.githubusercontent.com/hendrycks/test/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "mmlu",
 parts: Object.fromEntries(['Humanities', 'Social Sciences', 'STEM', 'Other'].map(name => [name, { name, group: 'Subject group' }])),
 url: "https://github.com/hendrycks/test",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const readme = await fetchText(FEED);
  const papers = new Map([...readme.matchAll(/^\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gm)].map(m => [m[1], m[2]]));
  const table = markdownTables(readme).find(t => t[0].includes('Average'));
  if (!table) throw new Error('MMLU table missing');
  return table.slice(1).filter(r => !/random/i.test(r[0]) && num(r[6]) !== undefined).map(r => {
    const parts = r[0].match(/^(.*?)\s*\((.*)\)$/);
    const config=parts?.[2]?.split(',').map(s=>s.trim())??[];
    const size=config.find(s=>/^[\d.]+B$/.test(s));
    return {link: papers.get(parts?.[1] ?? r[0]), params: size ? Number(size.slice(0, -1)) : undefined, model: parts ? parts[1]+(size?' '+size:'') : r[0], setting: config.filter(s=>s!==size).join(', ')||undefined, score: num(r[6])!, metrics: Object.fromEntries([2,3,4,5].map(i => [table[0][i], num(r[i])!]))};
  });
 },
};
export default withKaggle(board, { owner: 'open-benchmarks', slug: 'mmlu', task: 'mmlu_task', scale: 100 });
