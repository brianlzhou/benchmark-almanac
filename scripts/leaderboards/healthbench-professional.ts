// HealthBench Professional: overall rubric score from OpenAI's clinician release chart, in percent.
// The human baseline is excluded. The ChatGPT for Clinicians product configuration remains a separate harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartTitle, OPENAI_TERMS } from '../lib/boards/openai.ts';
const PAGE = 'https://openai.com/index/making-chatgpt-better-for-clinicians/';
const board: Leaderboard = {
  benchmark: 'healthbench-professional', url: PAGE, feed: `${PAGE} (embedded overall-score chart)`, terms: OPENAI_TERMS,
  async fetch() {
    const spec = (await openaiSpecs(PAGE)).find(s => chartTitle(s) === 'HealthBench Professional Overall Score');
    if (!spec?.data?.values?.length) throw new Error('HealthBench Professional overall chart missing');
    const expression = spec.transform?.find(t => t.as === 'modelLabel')?.calculate ?? '';
    const labels = new Map([...expression.matchAll(/datum\.modelKey === '([^']+)' \? '([^']+)'/g)].map(m => [m[1], m[2]]));
    const fallback = expression.match(/:\s*'([^']+)'\s*$/)?.[1];
    const unknown = spec.data.values.filter(r => !labels.has(String(r.modelKey)));
    if (fallback && unknown.length === 1) labels.set(String(unknown[0].modelKey), fallback);
    const rows: LeaderboardRow[] = [];
    for (const r of spec.data.values) {
      const label = labels.get(String(r.modelKey));
      if (!label) throw new Error(`Unlabeled HealthBench model ${r.modelKey}`);
      if (/physician/i.test(label)) continue;
      if (typeof r.score !== 'number' || !Number.isFinite(r.score)) throw new Error('Invalid HealthBench score');
      const parts = label.split(' in ');
      rows.push({ model: parts[0], score: r.score, ...(parts[1] ? { harness: parts[1] } : {}) });
    }
    return rows;
  },
};
export default board;
