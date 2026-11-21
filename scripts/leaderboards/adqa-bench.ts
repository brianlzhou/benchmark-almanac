// DCASE ranks audio question answering submissions by evaluation accuracy in percent.
// Read every submission in the overall HTML table, including the organizers' baseline.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://dcase.community/challenge2026/task-audio-dependent-question-answering-results";
const feed = url;

const board: Leaderboard = {
  benchmark: 'adqa-bench', url, feed,
  terms: "DCASE robots.txt allows the results page and restricts images and theme assets. DCASE gives no separate score license.",
  stats: {
    devAccuracy: { name: 'Development accuracy', unit: '%', better: 'higher' },
    difference: { name: 'Difference from evaluation accuracy', unit: '%', better: 'higher' },
  },
  aliases: { 'Baseline_Qwen3-Omni-30B': 'qwen3-omni-30b-a3b' },
  async fetch() {
    const all = tables(await fetchText(feed));
    const table = all.find(t => t[1]?.map(c => c.text).join('|') === 'Submission Code|Corresponding Author|Affiliation|Technical Report|Eval Accuracy|Dev Accuracy|Diff|Parameters|Lightweight');
    if (!table || table.length < 39) throw new Error('ADQA: incomplete overall ranking');
    return table.slice(2).map(c => {
      if (!c[1]?.text || !/^\d+(?:\.\d+)?$/.test(c[5]?.text)) throw new Error('ADQA: invalid submission');
      return { model: c[1].text, score: Number(c[5].text), submitter: c[3].text,
        params: Number(c[8].text) / 1e9, metrics: { devAccuracy: Number(c[6].text), difference: Number(c[7].text) },
        link: c[4].text ? url + '#collapse-' + c[4].text : undefined };
    });
  },
};
export default board;
