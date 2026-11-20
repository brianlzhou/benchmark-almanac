// LifeSciBench's overall mean rubric score (percent), from the official article's live Vega chart values.
// Workflow scores and pass rates are secondary metrics, never competing overall rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { openaiSpecs, chartValues, chartTitle, OPENAI_TERMS } from '../lib/boards/openai.ts';
const PAGE = 'https://openai.com/index/introducing-life-sci-bench/';
const board: Leaderboard = {
  benchmark: 'lifescibench', parts: {
  'workflowScore:evidence': { name: 'evidence', group: 'Dimension' },
  'workflowScore:analysis': { name: 'analysis', group: 'Dimension' },
  'workflowScore:design': { name: 'design', group: 'Dimension' },
  'workflowScore:reasoning': { name: 'reasoning', group: 'Dimension' },
  'workflowScore:validation': { name: 'validation', group: 'Dimension' },
  'workflowScore:Translation': { name: 'Translation', group: 'Dimension' },
  'workflowScore:Scientific Communication': { name: 'Scientific Communication', group: 'Dimension' },
  'workflowPassRate:evidence': { name: 'evidence', group: 'Dimension' },
  'workflowPassRate:analysis': { name: 'analysis', group: 'Dimension' },
  'workflowPassRate:design': { name: 'design', group: 'Dimension' },
  'workflowPassRate:reasoning': { name: 'reasoning', group: 'Dimension' },
  'workflowPassRate:validation': { name: 'validation', group: 'Dimension' },
  'workflowPassRate:Translation': { name: 'Translation', group: 'Dimension' },
  'workflowPassRate:Scientific Communication': { name: 'Scientific Communication', group: 'Dimension' },
}, url: PAGE, feed: `${PAGE} (embedded LifeSciBench overall and workflow charts)`, terms: OPENAI_TERMS,
  async fetch() {
    const specs = await openaiSpecs(PAGE);
    const rows: LeaderboardRow[] = chartValues(specs, 'LifeSciBench Overall Scores').map(r => {
      if (typeof r.model !== 'string' || typeof r.score_percent !== 'number') throw new Error('Invalid LifeSciBench row');
      const metrics: Record<string, number> = {};
      if (typeof r.ci_low_percent === 'number') metrics.ciLow = r.ci_low_percent;
      if (typeof r.ci_high_percent === 'number') metrics.ciHigh = r.ci_high_percent;
      return { model: r.model === 'GPT-Rosalind' ? r.model + ' (snapshot unspecified)' : r.model, score: r.score_percent, metrics };
    });
    for (const spec of specs) {
      const title = chartTitle(spec);
      const prefix = title === 'LifeSciBench Scores by Scientific Workflow' ? 'workflowScore' : title === 'LifeSciBench Pass Rate by Scientific Workflow' ? 'workflowPassRate' : null;
      if (!prefix) continue;
      for (const r of spec.data?.values ?? []) {
        const row = rows.find(row => row.model.replace(' (snapshot unspecified)', '') === r.model);
        if (row && typeof r.workflow_split === 'string' && typeof r.score_percent === 'number') row.metrics![`${prefix}:${r.workflow_split}`] = r.score_percent;
      }
    }
    return rows;
  },
};
export default board;
