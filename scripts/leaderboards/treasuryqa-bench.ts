// TreasuryQA ranks agents by average pass rate on scanned Treasury documents.
// The secondary pass^3 column counts tasks solved on all three repeats.
// The Veris standings include confidence intervals and results by scan quality.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://veris.ai/leaderboard/treasuryqa";

const board: Leaderboard = {
  benchmark: "treasuryqa-bench",
  url: "https://veris.ai/leaderboard/treasuryqa",
  feed: FEED,
  terms: "Veris reserves all rights. The public terms give no separate permission to reproduce leaderboard tables. https://veris.ai/terms-and-conditions Veris allows the /leaderboard/ path in robots.txt.",
  parts: { clear: 'Clear', veryBlurry: 'Very blurry' },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.[1]?.text.startsWith('pass@1'));
    const expected = ['Agent', 'pass@1', 'pass', 'Clear', 'Very blurry', '$/task', 'Harness'];
    if (!table || table.length < 13 || !/^pass(?:³|\^3|&sup3;)/i.test(table[0][2]?.text ?? '') || !expected.every((h, i) => table[0][i]?.text.startsWith(h))) throw new Error('TreasuryQA table changed');
    return table.slice(1).map(([agent, pass, allThree, clearScan, blurryScan, price, harness]) => {
      const interval = pass.text.match(/([\d.]+)%\s*([\d.]+)(?:&ndash;|–|-)([\d.]+)/);
      const duration = harness.html.match(/median ([\d.]+)(?:&nbsp;|\s)min per attempt/);
      const pass3 = num(allThree.text), clear = num(clearScan.text), veryBlurry = num(blurryScan.text), cost = num(price.text);
      if (!agent.text || !harness.text || !interval || !duration || pass3 == null || clear == null || veryBlurry == null || cost == null)
        throw new Error('Missing TreasuryQA result');
      return { model: agent.text, score: Number(interval[1]), low: Number(interval[2]), high: Number(interval[3]), trials: 3,
        harness: harness.text, cost, metrics: { pass3, clear, veryBlurry, medianMinutes: Number(duration[1]) } };
    });
  },
};
export default board;
