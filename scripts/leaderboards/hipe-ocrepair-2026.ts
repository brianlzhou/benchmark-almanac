// HIPE ranks OCR corrections by weighted character match error rate. The official TSV includes confidence intervals and the number of test sets scored.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/hipe-eval/HIPE-OCRepair-2026-eval/main/results/system-rankings/ranking-overall-test-weighted.tsv";

const board: Leaderboard = {
  benchmark: "hipe-ocrepair-2026",
  url: "https://hipe-eval.github.io/HIPE-OCRepair-2026/results",
  feed: FEED,
  terms: "The evaluation repository uses AGPL 3.0. It does not list separate terms for the ranking file. https://github.com/hipe-eval/HIPE-OCRepair-2026-eval/blob/main/LICENSE The robots URL returns HTML.",
  async fetch() {
    const [header, ...lines] = (await fetchText(FEED)).trim().split(/\r?\n/);
    if (header !== 'rank\tsystem\toverall_cmer\toverall_cmer_lo\toverall_cmer_hi\toverall_pref\toverall_pref_lo\toverall_pref_hi\tn_test_sets\tn_total_test_sets' || lines.length < 8) throw new Error('Changed HIPE rankings');
    return lines.map(line => {
      const [, model, ...cells] = line.split('\t');
      if (!model || cells.length !== 8 || !cells.every(v => v.trim() && Number.isFinite(Number(v)))) throw new Error('Incomplete HIPE system');
      const [score, low, high, preference, preferenceLow, preferenceHigh, testSets, totalTestSets] = cells.map(Number);
      return { model, score, low, high, metrics: { preference, preferenceLow, preferenceHigh, testSets, totalTestSets } };
    });
  },
};
export default board;
