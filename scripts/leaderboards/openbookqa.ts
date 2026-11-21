// OpenBookQA: test accuracy averaged over five runs is the headline score, in percent.
// Both no-knowledge baselines and knowledge-enhanced readers remain separate, with best-run accuracy and test deviation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/allenai/OpenBookQA/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "openbookqa",
 stats: { devMean: { name: 'Development mean accuracy', unit: '%', better: 'higher' }, testBest: { name: 'Test best accuracy', unit: '%', better: 'higher' }, devBest: { name: 'Development best accuracy', unit: '%', better: 'higher' } },
 url: "https://github.com/allenai/OpenBookQA",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const ts = markdownTables(await fetchText(FEED)).filter(t=>t[0].includes('Test (5 runs)'));
  if(ts.length!==2) throw new Error('OpenBookQA result tables changed');
  return ts.flatMap((t,index)=>t.slice(1).filter(r=>num(r[2])!==undefined).map(r=>({
    trials: 5, model:r[0], setting:index===0?'without external knowledge':'knowledge-enhanced reader',score:num(r[2])!,
    metrics:{devStd:num(r[1].split('±')[1])!,devMean:num(r[1])!,testStd:num(r[2].split('±')[1])!,testBest:num(r[4])!,devBest:num(r[3])!}
  })));
 },
};
export default board;
