// D-REX measures model susceptibility to deceptive reasoning. Table 2 reports the
// overall vulnerability rate on 500 sampled prompts. Lower rates are better.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2509.17938';
const board: Leaderboard = {
  benchmark: 'd-rex-gray-swan', feed, url: feed, static: 'paper',
  aliases: {'nova-pro-v1':'amazon-nova-pro'},
  headline: 'The paper reports overall vulnerability as the percentage of prompts that succeed. Lower values are better.',
  terms: 'The authors publish these aggregate results under the terms listed at https://arxiv.org/abs/2509.17938.',
  stats: { targetSuccess: { name: 'Target-specific jailbreak success rate', unit: '%', better: 'lower' } },
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t=>t[0]?.[2]?.startsWith('Overall Vulnerability (%)') && t[0][1].startsWith('Target-Specific Success'));
    if (!t) throw new Error('Missing D-REX aggregate results');
    return checked(t.slice(1).filter(c=>c[0]).map(([label,target,overall]) => {
      const [score,stderr] = overall.split(' \\pm ').map(numberCell);
      const [targetSuccess,targetSe] = target.split(' \\pm ').map(numberCell);
      if (stderr === undefined || targetSe === undefined) throw new Error('Missing standard errors');
      const thinking = label.endsWith(':thinking');
      const model = /^(?:google\/gemini-2.5-|deepseek\/deepseek-r1$)/.test(label) ? label + ' (snapshot unspecified)' : label.replace(/:thinking$/, '');
      return {model, setting:thinking ? 'Thinking' : undefined, score, metrics:{stderr,targetSuccess,targetSe}};
    }),7);
  },
};
export default board;
