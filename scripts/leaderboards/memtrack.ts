// MEMTRACK tests memory across a timeline of enterprise events. Table 3 reports answer correctness
// averaged per example across five runs. Table 6 gives its standard deviation. Convert both to percentage points.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2510.01353';
const percent = (s: string) => Number((100 * numberCell(s)).toFixed(3));
const board: Leaderboard = {
  benchmark:'memtrack', static:'paper', url, feed:url, terms:PAPER_TERMS,
  parts: {
    efficiency:{name:'Efficiency',unit:'%'}, redundancy:{name:'Redundancy',unit:'%',better:'lower'},
    callsMean:{name:'Mean tool calls',unit:'score'}, callsMax:{name:'Maximum tool calls',unit:'score'},
    entropy:{name:'Cross-platform tool call entropy',unit:'score'}, std:{name:'Correctness standard deviation',unit:'%'},
    followUp:{name:'Follow-up correctness',unit:'%'},
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(url)).map(grid);
    const main = tables.find(t => t[0][1]?.startsWith('Correct.') && t[0][2]?.startsWith('Eff.') && t[0][3]?.startsWith('Red.') && t[0][4]?.includes('mean/max') && t[0][5]?.includes('H(TC'));
    const sigma = tables.find(t => t[0][1]?.includes('sigma (Correctness)'));
    const follow = tables.find(t => t[3]?.[0] === 'Follow-Up');
    if (!main || !sigma || !follow) throw new Error('Missing MEMTRACK results');
    return checked(main.slice(1).map(([method, correct, eff, red, calls, entropy]) => {
      const [model,harness] = method.split('+');
      const [mean,max] = calls.split('/');
      const std = sigma.find(r => r[0] === method)?.[1];
      const col = follow[0].findIndex((h,i) => h === harness.toLowerCase() && follow[1][i] === (model.startsWith('gemini') ? 'gemini' : model));
      if (!std || col < 1) throw new Error('Missing results for ' + method);
      return {model,harness,trials:5,score:percent(correct),metrics:{std:percent(std),efficiency:percent(eff),redundancy:percent(red),
        callsMean:numberCell(mean), callsMax:numberCell(max),entropy:numberCell(entropy),followUp:percent(follow[3][col])}};
    }),6);
  },
};
export default board;
