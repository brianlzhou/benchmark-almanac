// ISD leads its report with English accuracy on routine voter questions and compares the Spanish results separately.
// The two page 12 charts each cover 150 responses per model. A file hash guards the transcribed counts.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = "https://www.isdglobal.org/wp-content/uploads/2026/09/Chatbots-and-the-Ballot-Box-US-elections.pdf";
const board: Leaderboard = {
  benchmark: "isd-chatbots-and-the-ballot-box",
  url: "https://www.isdglobal.org/wp-content/uploads/2026/09/Chatbots-and-the-Ballot-Box-US-elections.pdf",
  feed,
  terms: "The report reserves all rights. Researchers can request the full responses and accuracy codes. The site's robots.txt permits this report.",
  parts: { english: 'English', spanish: 'Spanish' },
  aliases: { 'Sonnet 4.6': 'claude-sonnet-4-6' },
  async fetch() {
    const results: [string, number, number][] = [
      ['GPT-5.5', 134, 123], ['Gemini 3.5 Flash', 126, 96], ['Sonnet 4.6', 96, 75],
      ['Grok 4.3', 99, 84], ['DeepSeek V4 Pro', 94, 60], ['Muse Spark', 92, 57],
    ];
    return chartRows(feed, 'dd5a4b4a85e905c6ce3b7f312f9dc6c3b42dd5a4131b426e103afbca0a30f10a',
      results.map(([model, english, spanish]) => ({ model, score: 100 * english / 150,
        metrics: { english: 100 * english / 150, spanish: 100 * spanish / 150 } })));

  },
};
export default board;
