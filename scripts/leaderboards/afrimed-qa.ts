// Official AfriMed-QA README: No Explanation, AfriMed-QA v1 column.
// Other columns describe different populations and stay metrics, never headline rows.
// Prompt-comparison tables do not identify their population as v1 and are not mixed in.
// Undated API models and base/instruct-ambiguous labels remain explicitly unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/intron-innovation/AfriMed-QA/master/README.md';
const board: Leaderboard = {
  benchmark: 'afrimed-qa', url: 'https://github.com/intron-innovation/AfriMed-QA#model-performance-metrics', feed: FEED,
  terms: 'Public author-published results in the AfriMed-QA repository. Benchmark Almanac credits the AfriMed-QA team and links the source.',
  async fetch() {
    const text = await fetchText(FEED);
    const section = text.split('## No Explanation (MCQ - Accuracy, SAQ BertScore)')[1]?.split('## With Explanations')[0];
    if (!section?.includes('Afrimed-QA v1')) throw new Error('AfriMed-QA v1 table missing');
    const rows: LeaderboardRow[] = [];
    const number = (s: string | undefined) => /^0(?:\.\d+)?$|^1(?:\.0+)?$/.test(s ?? '') ? Number(s) : undefined;
    const metricKeys = ['usmle', 'afrimed_experts', 'afr_mcq', 'afr_saq_bertscore'];
    for (const line of section.split('\n')) {
      if (!line.trim().startsWith('|')) continue;
      const cells = line.trim().split('|').slice(1).map(s => s.trim());
      const value = number(cells[2]);
      if (value === undefined || !cells[0]) continue;
      let model = cells[0];
      if (/^(?:gpt|claude)/i.test(model) && !/1106/.test(model)) model += ' [snapshot unspecified]';
      if (/^Meta-Llama-/i.test(model) && !/Instruct/i.test(model)) model += ' [base or instruct unspecified]';
      const metrics: Record<string, number> = {};
      metricKeys.forEach((k, i) => { const v = number(cells[i + 3]); if (v !== undefined) metrics[k] = i === 3 ? v : Number((v * 100).toFixed(4)); });
      rows.push({model, score: Number((value * 100).toFixed(4)), setting: 'AfriMed-QA v1; no explanation', metrics});
    }
    if (!rows.length) throw new Error('No AfriMed-QA v1 scores');
    return rows;
  },
};
export default board;
