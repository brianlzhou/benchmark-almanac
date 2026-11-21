// KernelQuest reports the share of 300 agent runs that meet a certified GPU speedup target.
// The chart reads a four-model summary and pass rates by difficulty from Turing’s app bundle.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://labs.turing.com/assets/index-BZIruKnx.js";


const board: Leaderboard = {
  benchmark: "kernelquest-turing",
  url: "https://labs.turing.com/benchmarks/kernelquest",
  feed,
  terms: "The publisher gives no reuse license on the benchmark page. https://labs.turing.com/benchmarks/kernelquest Its robots.txt route serves the app.",
  harnesses: 'system',
  async fetch() {
    const html = await fetchText(board.url);
    const path = html.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!path) throw new Error('Missing Turing bundle');
    await new Promise(resolve => setTimeout(resolve,1000));
    const js = await fetchText(new URL(path, board.url).href);
    const levels = [...js.matchAll(/\{key:"(l[1-4])",code:"(L[1-4])",name:"([^"]+)",tasks:\d+,color:[^\]]+?\],passRate:\{([^}]+)\}/g)];
    if (levels.length !== 4) throw new Error('Missing KernelQuest difficulty scores');
    board.parts = Object.fromEntries(levels.map(([,key,code,name])=>[key,{name:code+': '+name,group:'Level'}]));
    const records = [...js.matchAll(/\{key:"([^"]+)",model:"([^"]+)",provider:"[^"]+",scaffold:"([^"]+)",[^{}]*?\}/g)].filter(([s])=>s.includes('geoSpeedup:') && s.includes('passingRuns:'));
    if (records.length < 4) throw new Error('Missing KernelQuest model summaries');
    return records.map(([record,key,model,harness]) => {
      const metrics: Record<string,number> = Object.fromEntries([...record.matchAll(/,(\w+):(-?[\d.]+)(?=[,}])/g)].map(m=>[m[1],Number(m[2])]));
      const { passRate, ci, meanWallMinutes, ...other } = metrics;
      if (![passRate,ci,meanWallMinutes].every(Number.isFinite)) throw new Error('Missing numbers for '+model);
      for (const [,lk,,,rates] of levels) {
        const s = rates.split(',').find(pair=>pair.startsWith(key+':'));
        if (!s) throw new Error('Missing level for '+model);
        other[lk] = Number(s.split(':')[1]);
      }
      return { model, harness, trials:3, score:passRate, low:passRate-ci, high:passRate+ci, metrics:{...other,latency:meanWallMinutes*60} };
    });
  },
};
export default board;
