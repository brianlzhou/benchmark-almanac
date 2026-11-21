// TASTE measures how well models match experienced AI safety researchers' pairwise proposal preferences.
// This importer reads Table 3 of the benchmark paper, where accuracy is averaged over both orderings and prompt variations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://www-cdn.anthropic.com/files/4zrzovbb/website/dd5feddcb3b7d20aadda6af4093ac1fb0c9d419e.pdf';
const board: Leaderboard = {
  benchmark: 'taste', static: 'paper', url: FEED, feed: FEED,
  terms: 'The paper is published by Anthropic for research use. https://www-cdn.anthropic.com/files/4zrzovbb/website/dd5feddcb3b7d20aadda6af4093ac1fb0c9d419e.pdf',
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split(/Table 3: Performance on TASTE/)[1]?.split(/D\.2\s+Effects of Situational Context/)[0];
    if (!table) throw new Error('Table 3 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/)) {
      const m = line.trim().match(/^(.+?)\s+(Anthropic|OpenRouter|OpenAI)\s+(\d{4}-\d{2}-\d{2})\s+(\S+)\s+(\d+)$/);
      if (!m) continue;
      rows.push({ model: m[1], setting: m[4], date: m[3], score: Number(m[5]), submitter: m[2] });
    }
    if (rows.length !== 19) throw new Error(`Expected 19 Table 3 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
