// ClimateCheck tests retrieval and verification of climate claims against scientific abstracts.
// The paper ranks claim verification by F1 plus retrieval Recall@10. This importer reads Table 3.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2025.sdp-1.24.pdf';
const board: Leaderboard = {
  benchmark: 'climatecheck-2025',
  static: 'paper',
  url: 'https://aclanthology.org/2025.sdp-1.24/',
  feed: FEED,
  terms: 'The paper is published by the Association for Computational Linguistics. https://aclanthology.org/2025.sdp-1.24/ The table is credited to the authors.',
  headline: 'The paper ranks claim verification by the sum of F1 and retrieval Recall@10.',
  aliases: {
    'Gemini 2.5': 'gemini-2-5-pro-mar-2025',
    'GPT-4.1': 'gpt-4-1',
    'Qwen 14B': 'qwen2-5-14b',
    'Yi-1.5-9B-Chat-16K': 'yi-1-5-9b-chat',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const start = text.indexOf('Table 2: Results of Subtask I');
    const end = text.indexOf('Table 3: Results of Subtask II', start);
    if (start < 0 || end < 0) throw new Error('ClimateCheck Table 3 missing');
    const section = text.slice(start, end);
    const rows: LeaderboardRow[] = [];
    const models: Record<string, string> = {
      'Ant Bridge': 'Gemini 2.5',
      akiepura_jlam: 'GPT-4.1',
      EFC: 'Qwen 14B',
      'Our baseline': 'Yi-1.5-9B-Chat-16K',
    };
    const flat = section.replace(/\s+/g, ' ');
    for (const team of Object.keys(models)) {
      const match = flat.match(new RegExp(`(?:^| )((?:\\d+)|–) ${team.replace(' ', ' ')} (0\\.\\d+) (0\\.\\d+) (0\\.\\d+) ([0-9]+\\.\\d+)`));
      if (!match) throw new Error(`ClimateCheck row missing: ${team}`);
      const [, rank, precision, recall, f1, score] = match;
      const model = models[team];
      if (!model) throw new Error(`Unknown ClimateCheck team: ${team}`);
      rows.push({ model, score: Number(score), submitter: team, metrics: { precision: Number(precision), recall: Number(recall), f1: Number(f1) } });
    }
    if (rows.length !== 4) throw new Error(`Expected four ClimateCheck rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
