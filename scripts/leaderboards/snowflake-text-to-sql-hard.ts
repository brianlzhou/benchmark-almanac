// Snowflake Text-to-SQL HARD measures execution accuracy on difficult Snowflake SQL generation tasks.
// The importer reads the paper's Figure 1 chart, whose bars are the benchmark headline percentages.
// Values were transcribed twice and guarded by the chart SHA-256.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const IMAGE = 'https://www.snowflake.com/adobe/dynamicmedia/deliver/dm-aid--bc7d70f6-ded6-47e6-a98e-b05d2500674c/arctictext2sqlr2fig1.png?quality=100&preferwebp=true&sfver=28672822';
const board: Leaderboard = {
  benchmark: 'snowflake-text-to-sql-hard', static: 'paper', url: 'https://www.snowflake.com/en/blog/engineering/enterprise-text-to-sql-arctic-r2/', feed: IMAGE,
  terms: 'Snowflake publishes the comparison chart publicly. Attribution and source licensing apply.',
  async fetch(): Promise<LeaderboardRow[]> {
    return chartRows(IMAGE, 'dee301c9c54cbe37991570fa01888b7c3c155a19008b6b4d7d8e5797b938f8d1', [
      { model: 'Arctic Text2SQL R2', score: 48.7 }, { model: 'Gemini 3.1 Pro', score: 47.9 },
      { model: 'Claude Opus 4.7', score: 47.3 }, { model: 'Claude Sonnet 4.6', score: 45.5 },
      { model: 'Grok 4.2.0', score: 45.5 }, { model: 'Arctic Text2SQL R1.5', score: 45.1 },
      { model: 'Gemini 3.1 Flash Lite', score: 44.5 }, { model: 'GPT-5.3 Codex', score: 41.6 },
      { model: 'Kimi K2.5', score: 41.0 }, { model: 'Claude Haiku 4.5', score: 40.8 },
      { model: 'GPT-5.4', score: 39.0 }, { model: 'GLM-5.1', score: 38.2 },
      { model: 'Grok 4.1 Fast', score: 35.6 }, { model: 'Qwen3.6 35B-A3B', score: 33.7 },
    ]);
  },
};
export default board;
