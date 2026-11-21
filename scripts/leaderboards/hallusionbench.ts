// HallusionBench: Question Acc is the per-question accuracy used for model comparisons, in percent.
// Use GPT Eval consistently across models. Human-evaluated accuracy is a secondary metric.
// Pair, figure and difficulty metrics remain attached to the GPT-evaluated row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/tianyi-lab/HallusionBench/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "hallusionbench",
 stats: {
  'Question Pair Acc': { name: 'Question pair accuracy', unit: '%', better: 'higher' },
  'Figure Acc': { name: 'Figure accuracy', unit: '%', better: 'higher' },
 },
 parts: {
   'Easy Question Acc': { name: 'Easy', group: 'Difficulty' },
   'Hard Question Acc': { name: 'Hard', group: 'Difficulty' },
 },
 url: "https://github.com/tianyi-lab/HallusionBench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const source = await fetchText(FEED);
  const table = markdownTables(source.replace(/\[VD\]\((https?:[^)]+)\)/g, '$1')).find(t=>t[0].includes('Question Acc'));
  if (!table) throw new Error('HallusionBench table missing');
  return table.slice(1).filter(r=>num(r[5])!==undefined && /\(GPT Eval\)/.test(r[0])).map(r=>{
    const evaluator = 'GPT Eval';
    const human=table.slice(1).find(s=>s[0]===r[0].replace('(GPT Eval)','(Human Eval)'));
    const humanScore=human?num(human[5]):undefined;
    const humanMetrics: Record<string, number> = {};
    if (human) {
      for (let col = 1; col <= 4; col++) {
        const value = num(human[col]);
        if (value !== undefined) humanMetrics['Human: ' + table[0][col]] = value;
      }
    }
    const link = r[6]?.match(/^https?:[^, ]+/)?.[0];
    return {link, model:r[0].replace(/\s*\((Human Eval|GPT Eval)\)/,'').trim(), setting:evaluator,
      score:num(r[5])!, metrics:{...humanMetrics,...Object.fromEntries([1,2,3,4].map(i=>[table[0][i],num(r[i])!])),...(humanScore===undefined?{}:{humanAccuracy:humanScore})}};
  });
 },
};
export default board;
