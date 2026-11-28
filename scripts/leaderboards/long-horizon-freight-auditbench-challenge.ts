// Loop evaluates freight invoices by the percentage audited correctly. The six challenge scores are transcribed from the light bars in its published chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checkChart } from '../lib/boards/transcribed-github-chart.ts';

const feed = "https://cdn.prod.website-files.com/668c00971d3dfeff704769f4/6a963f27c8b04196ac9be935_ea04a921.avif";

const board: Leaderboard = {
  benchmark: "long-horizon-freight-auditbench-challenge",
  static: 'paper',
  url: "https://www.loop.com/article/introducing-the-long-horizon-auditbench-for-supply-chain-ai",
  feed,
  terms: "Loop reserves all rights. Its article reports relative inference costs. https://www.loop.com/article/introducing-the-long-horizon-auditbench-for-supply-chain-ai The robots.txt request returned 403.",
  async fetch() {
    const article = await fetchText(board.url);
    if (!article.includes(feed)) throw new Error('Loop replaced its results chart');
    await checkChart(feed, '78ea490645a51ae1934f8a3929a18357006531522b745b5d01c913d0f52cf594');
    return [
      { model: 'Loop', score: 65 },
      { model: 'Claude Opus 5', score: 10 },
      { model: 'GLM 5.3 Flash', score: 5 },
      { model: 'Kimi K3', score: 5 },
      { model: 'GPT-5.6 Luna', score: 4 },
      { model: 'Grok 4.6', score: 1 },
    ];
  },
};
export default board;
