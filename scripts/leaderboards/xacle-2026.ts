// XACLE ranks audio alignment systems by test-set Spearman rank correlation with listener scores.
// The systems table loads a JSON file with test and validation measures for every submission.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://xacle.org/2026/json/results_system.json";
type Group = { name: string; test: Record<string, string>; val: Record<string, string> };
const board: Leaderboard = {
  benchmark: "xacle-2026",
  url: "https://xacle.org/2026/results.html",
  feed: FEED,
  terms: "The organizers publish system scores without a stated score reuse license on the results page. https://xacle.org/2026/results.html The robots URL returns HTML.",
  parts: { valSRCC: 'Validation SRCC' },
  stats: {
    testLCC: { name: 'Test linear correlation coefficient', unit: 'score', better: 'higher' },
    valLCC: { name: 'Validation linear correlation coefficient', unit: 'score', better: 'higher' },
    testKTAU: { name: 'Test Kendall tau', unit: 'score', better: 'higher' },
    valKTAU: { name: 'Validation Kendall tau', unit: 'score', better: 'higher' },
    testMSE: { name: 'Test mean squared error', unit: 'score', better: 'lower' },
    valMSE: { name: 'Validation mean squared error', unit: 'score', better: 'lower' },
  },
  async fetch() {
    const data = await fetchJson<{ metrics: string[]; groups: Group[] }>(FEED);
    const required = ['SRCC', 'LCC', 'KTAU', 'MSE'];
    if (!required.every(k => data.metrics.includes(k)) || data.groups.length < 49) throw new Error('Missing XACLE standings');
    return data.groups.map(entry => {
      const metrics: Record<string, number> = {};
      for (const key of required) {
        for (const split of ['test', 'val'] as const) {
          const raw = entry[split][key];
          if (split === 'val' && raw === 'nan') continue;
          if (!raw?.trim() || !Number.isFinite(Number(raw))) throw new Error('Invalid XACLE score: ' + entry.name);
          if (split !== 'test' || key !== 'SRCC') metrics[split + key] = Number(raw);
        }
      }
      if (!entry.name) throw new Error('Missing XACLE system name');
      return { model: entry.name, score: Number(entry.test.SRCC), metrics,
        submitter: entry.name.match(/^(.+)_\d+$/)?.[1] };
    });
  },
};
export default board;
