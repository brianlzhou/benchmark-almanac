// HELM Lite (Stanford CRFM). The board's headline is "Mean win rate" in the Accuracy table of core_scenarios.json:
// the share of other models each model beats, averaged over the ten scenarios. It is relative to the models on
// the board, times 100. Read through helmRows in helm-capabilities.ts.
import { fetchJson } from '../lib/util.ts';
import type { Leaderboard } from './types.ts';
import { HELM_BUCKET, helmNewest, HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'lite', group: 'core_scenarios', table: 'Accuracy', column: 'Mean win rate', scale: 100 };
const SCENARIOS = ['NarrativeQA', 'NaturalQuestions (open-book)', 'NaturalQuestions (closed-book)', 'OpenbookQA', 'MMLU', 'MATH', 'GSM8K', 'LegalBench', 'MedQA', 'WMT 2014'];
const labelOf = (s: string) => (s === 'WMT 2014' ? 'Workshop on Machine Translation 2014' : s);
const parts: NonNullable<Leaderboard['parts']> = {
  'NarrativeQA - F1': { name: 'NarrativeQA', group: 'Scenario', unit: 'score', note: 'Answer F1 from 0 to 1.' },
  'NaturalQuestions (open-book) - F1': { name: 'NaturalQuestions (open-book)', group: 'Scenario', unit: 'score', note: 'Answer F1 from 0 to 1.' },
  'NaturalQuestions (closed-book) - F1': { name: 'NaturalQuestions (closed-book)', group: 'Scenario', unit: 'score', note: 'Answer F1 from 0 to 1.' },
  'OpenbookQA - EM': { name: 'OpenbookQA', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
  'MMLU - EM': { name: 'MMLU', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
  'MATH - Equivalent (CoT)': { name: 'MATH', group: 'Scenario', unit: 'score', note: 'Chain-of-thought equivalence from 0 to 1.' },
  'GSM8K - EM': { name: 'GSM8K', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
  'LegalBench - EM': { name: 'LegalBench', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
  'MedQA - EM': { name: 'MedQA', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
  'WMT 2014 - BLEU-4': { name: 'Workshop on Machine Translation 2014', group: 'Scenario', unit: 'score', note: 'BLEU-4 from 0 to 1.' },
};
const stats: NonNullable<Leaderboard['stats']> = {
  'Efficiency mean win rate': { name: 'Efficiency mean win rate', unit: 'score', better: 'higher', note: 'Share of models beaten on inference speed, from 0 to 1.' },
  'General information mean win rate': { name: 'General information mean win rate', unit: 'score' },
  ...Object.fromEntries(SCENARIOS.flatMap((scenario) => {
    const label = labelOf(scenario);
    return [
      [`${scenario} - Observed inference time (s)`, { name: `${label} inference time`, unit: 'seconds', better: 'lower' as const }],
      [`${scenario} - truncated`, { name: `${label} truncated fraction`, unit: 'score', better: 'lower' as const }],
      [`${scenario} - # prompt tokens`, { name: `${label} prompt tokens`, unit: 'tokens' }],
      [`${scenario} - # output tokens`, { name: `${label} output tokens`, unit: 'tokens' }],
    ];
  })),
};

const board: Leaderboard = {
  benchmark: 'helm-lite',
  url: 'https://crfm.stanford.edu/helm/lite/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  parts,
  stats,
  async fetch() {
    const rows = await helmRows(TABLE);
    const newest = await helmNewest('lite');
    const tables = await fetchJson<any[]>(`${HELM_BUCKET}/${newest}groups/core_scenarios.json`);
    const accuracy = tables.find(t => t.title === 'Accuracy');
    const scoreIndex = accuracy?.header.findIndex((h: any) => h.value === 'Mean win rate');
    const source = accuracy?.rows.filter((r: any) => typeof r[scoreIndex]?.value === 'number');
    if (!source || source.length !== rows.length) throw new Error('HELM Lite changed during resource join');
    for (let i = 0; i < rows.length; i++) {
      if (Math.abs(source[i][scoreIndex].value * 100 - rows[i].score) > 1e-8) throw new Error('HELM Lite score join mismatch');
      const metrics: Record<string, number> = {};
      for (const table of tables) {
        const record = table.rows.find((r: {value: unknown}[]) => r[0]?.value === source[i][0]?.value);
        if (!record) continue;
        for (const [j, header] of table.header.entries()) {
          const key = header.value, value = record[j]?.value;
          if (j === 0 || typeof value !== 'number' || (table === accuracy && j === scoreIndex) || / - # (?:eval|train)$/.test(key)) continue;
          metrics[key === 'Mean win rate' ? table.title + ' mean win rate' : key] = value;
        }
      }
      rows[i].metrics = {...rows[i].metrics, ...metrics};
    }
    return rows;
  },
};
export default board;
