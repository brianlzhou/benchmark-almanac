// Pieverse compares models trading a $1,000 portfolio. This is the day 3 Polymarket snapshot on December 25, 2025.
// The six dollar values were transcribed twice from the summary chart and the corresponding named cards.
// Each pair of cards also reports daily change and win rate. SHA-256 checks guard the three source images.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const base = 'https://public.bnbstatic.com/static/content/square/images/';
const report = 'https://www.binance.com/en/square/post/34215037143833';
function row(model: string, score: number, dailyChange: number, winRate: number): LeaderboardRow {
  return { model, score, date: '2025-12-25', setting: 'Polymarket, day 3', metrics: { dailyChange, winRate } };
}
const images = [
  { file: '58825cd1bd974eb9adce3ff6a57fbeea.png', hash: '8359cfe821f1a54cca4d8f91af47ff046c899188cd5ab5f1d9a6b2282e8e63f3',
    rows: [row('Claude Sonnet 4.5', 981.32, -0.4, 10), row('Grok 4.1', 950.00, -1.9, 19)] },
  { file: '5d6673bdbea34b5e9587c0d108e4d262.png', hash: '499cf77fb30f9165b10dc1163cdb2c024c7b4ea31af28ae51372fcd3e40985ca',
    rows: [row('GPT 5.2', 910.46, -2.5, 29), row('Gemini 3 Flash', 813.71, 0, 19)] },
  { file: 'b3cf755539134b9bb44e33b9b425c754.png', hash: '2ab1993e216748760f5d570f3369bfd5a1c5e886ef4400ca87c637ec775dc458',
    rows: [row('DeepSeek v3.2', 759.41, -12, 33), row('Kimi K2', 666.84, -14.5, 32)] },
];
const board: Leaderboard = {
  benchmark: 'pieverse-agent-prediction-arena', url: report, feed: base + images[0].file,
  terms: 'Pieverse published the performance report on Binance Square. https://www.binance.com/en/terms',
  aliases: { 'Kimi K2': 'kimi-k2-sep-2025' },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const image of images) {
      if (rows.length) await new Promise(resolve => setTimeout(resolve, 1000));
      rows.push(...await chartRows(base + image.file, image.hash, image.rows));
    }
    return checked(rows, 6);
  },
};
export default board;
