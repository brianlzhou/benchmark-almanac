// ParallelKernelBench: the published Total row gives solved counts over all 87 problems.
// Use Total pass@1 as a percentage. Keep pass@3, faster-than-reference counts and category pass@1 in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://www.together.ai/blog/parallelkernelbench";
const board: Leaderboard = {
 benchmark: "parallelkernelbench", url: "https://www.together.ai/blog/parallelkernelbench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.[0]?.text === 'Category');
    if (!t) throw new Error('Missing kernel results');
    const total = t.find(r => r[0]?.text === 'Total');
    const n = num(total?.[1]?.text);
    if (!total || !n) throw new Error('Missing total task count');
    const rows: LeaderboardRow[] = [];
    for (let m = 0; m < 6; m++) {
      let model = t[0][m+2].text;
      if (['Gemini 3 Pro','DeepSeek V4 Pro'].includes(model)) model += ' [snapshot unspecified]';
      const pass = total[2+m*2]?.text.split('→').map(num);
      const fast = total[3+m*2]?.text.split('→').map(num);
      if (pass?.[0] === undefined || pass[1] === undefined || fast?.[0] === undefined || fast[1] === undefined)
        throw new Error('Invalid total sampling counts');
      const metrics: Record<string, number> = {tasks:n, passed:pass[0], 'pass@3':pass[1]/n*100,
        fast1Percent:fast[0]/n*100, fast1Count:fast[0], fast1At3:fast[1]/n*100};
      for (const r of t.slice(2)) {
        if (r === total) continue;
        const size = num(r[1]?.text), solved = num(r[2+m*2]?.text.split('→')[0]);
        if (size && solved !== undefined) metrics[r[0].text.toLowerCase().replace(/[^a-z0-9]+/g,'_')] = solved/size*100;
      }
      rows.push({model, score:pass[0]/n*100, harness:'mini-swe-agent', metrics});
    }
    return rows;
 },
};
export default board;
