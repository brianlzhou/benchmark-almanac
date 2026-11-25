// CareQA evaluates medical question answering across close-ended tasks.
// The paper reports ten accuracy parts and no overall score, so this importer uses their plain mean.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2502.06666';
const board: Leaderboard = {
  benchmark: 'careqa',
  static: 'paper',
  url: FEED,
  feed: FEED,
  terms: PAPER_TERMS,
  parts: {
    medmcqa: 'MedMCQA',
    medqa: 'MedQA',
    careqaEn: 'CareQA (English)',
    careqaEs: 'CareQA (Spanish)',
    multimedqa: 'MultiMedQA',
    pubmedqa: 'PubMedQA',
    medTextClassification: 'Medical text classification',
    medTranscriptions: 'Medical transcriptions',
    biored: 'BioRED',
    mmlu: 'MMLU',
  },
  headline: 'The paper reports no overall score, so this is the plain mean of its ten close-ended accuracy parts.',
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(FEED)).map(grid).find((t) => t[0]?.[0] === 'Model' && t[0]?.[1] === 'Close-ended');
    if (!table) throw new Error('CareQA close-ended table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      const model = row[0];
      if (!model || model === 'Model') continue;
      const parsed = row.slice(1, 11).map((cell) => cell.split('±').map((part) => Number(part.trim())));
      const values = parsed.map((p) => p[0]);
      if (values.length !== 10 || values.some((value) => !Number.isFinite(value))) throw new Error(`Invalid CareQA row: ${row.join('|')}`);
      const keys = ['medmcqa', 'medqa', 'careqaEn', 'careqaEs', 'multimedqa', 'pubmedqa', 'medTextClassification', 'medTranscriptions', 'biored', 'mmlu'];
      const metrics: Record<string, number> = {};
      keys.forEach((key, index) => {
        metrics[key] = values[index] * 100;
        if (Number.isFinite(parsed[index][1])) metrics[key + 'Std'] = parsed[index][1] * 100;
      });
      rows.push({ model, score: values.reduce((sum, value) => sum + value, 0) * 10, setting: 'close-ended accuracy', metrics });
    }
    return checked(rows, 12);
  },
};
export default board;
