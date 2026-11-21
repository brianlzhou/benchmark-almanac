// Snowflake AI_EXTRACT measures document extraction accuracy on fields, lists and tables.
// The source has no single provider score, so the field score is the headline and the other types are metrics.
// Values were transcribed twice from Figure 2 and guarded by its SHA-256.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const IMAGE = 'https://www.snowflake.com/adobe/dynamicmedia/deliver/dm-aid--d3d8d3d6-4083-4de9-80cb-5d9ffc9b4d12/figure-2.-improving-document-extraction-quality-in-snowflake-ai-extract.png?preferwebp=true&quality=100&sfver=aba6ce7c';
const board: Leaderboard = {
  benchmark: 'ai-extract-11-datasets-snowflake', url: 'https://www.snowflake.com/en/blog/engineering/ai-extract-document-extraction-quality/', feed: IMAGE,
  terms: 'Snowflake publishes the comparison chart publicly. Attribution and source licensing apply.',
  headline: 'The source reports no overall provider score, so this is the field extraction accuracy column.',
  parts: { fields: { name: 'Field', unit: 'score' }, lists: { name: 'List', unit: 'score' }, tables: { name: 'Table', unit: 'score' } },
  async fetch(): Promise<LeaderboardRow[]> {
    return chartRows(IMAGE, 'cbb187d22da6fb39992c7faa861951537ea00a1e20c7c8070c98c63a6f568650', [
      { model: 'Snowflake AI Extract', score: 0.95, metrics: { lists: 0.86, tables: 0.93 } },
      { model: 'Databricks (Precision mode)', score: 0.88, metrics: { lists: 0.76, tables: 0.87 } },
      { model: 'AWS Textract', score: 0.54 },
      { model: 'Azure Document Intelligence', score: 0.30 },
    ]);
  },
};
export default board;
