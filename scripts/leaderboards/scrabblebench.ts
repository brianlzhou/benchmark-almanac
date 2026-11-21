// ScrabbleBench ranks fixed-seed games by the mean score of four seats.
// The maker publishes the self-play results as an image. Its checksum guards the transcription.
import type { Leaderboard } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';

const feed = "https://sunnybala.github.io/scrabblebench/gh-pages-assets/self-play.png";
const standings: [string, number, number, number, number, number, number, number][] = [
  ["openai/gpt-5", 152.8, 75.0, 100.0, 100.0, 92.0, 117.0, 435.1],
  ["google/gemini-2.5-pro", 145.8, 77.0, 100.0, 88.0, 88.0, 125.0, 238.2],
  ["anthropic/claude-sonnet-4", 122.0, 79.0, 100.0, 100.0, 67.0, 96.0, 5.3],
  ["x-ai/grok-3", 121.2, 86.0, 58.0, 41.0, 39.0, 146.0, 3.6],
  ["qwen/qwen3-235b-a22b-thinking-2507", 121.0, 68.0, 79.0, 54.0, 57.0, 138.0, 273.2],
  ["x-ai/grok-4", 116.2, 88.0, 92.0, 79.0, 60.0, 132.0, 560.3],
  ["openai/gpt-4o", 115.8, 78.0, 100.0, 86.0, 42.0, 125.0, 3.1],
  ["anthropic/claude-opus-4.1", 114.8, 81.0, 93.0, 80.0, 67.0, 224.0, 8.9],
  ["google/gemini-2.5-flash", 112.8, 93.0, 89.0, 60.0, 17.0, 185.0, 2.4],
  ["google/gemini-2.0-flash-001", 109.8, 75.0, 60.0, 67.0, 33.0, 195.0, 1.5],
  ["google/gemini-2.0-flash-lite-001", 105.5, 79.0, 40.0, 59.0, 40.0, 167.0, 1.8],
  ["deepseek/deepseek-chat-v3-0324", 104.0, 85.0, 100.0, 86.0, 43.0, 244.0, 15.0],
  ["moonshotai/kimi-k2", 102.0, 87.0, 48.0, 50.0, 25.0, 234.0, 4.4],
  ["openai/gpt-4.1", 101.0, 75.0, 72.0, 60.0, 20.0, 245.0, 2.6],
  ["openai/gpt-oss-120b", 89.8, 74.0, 35.0, 30.0, 40.0, 172.0, 22.8],
  ["qwen/qwen3-30b-a3b-instruct-2507", 85.0, 76.0, 67.0, 69.0, 50.0, 186.0, 6.0],
  ["openai/gpt-5-nano", 65.0, 79.0, 28.0, 27.0, 20.0, 184.0, 51.2],
];

const board: Leaderboard = {
  benchmark: "scrabblebench",
  url: "https://sunnybala.github.io/scrabblebench/",
  feed,
  terms: "The chart gives no reuse license. The separate round dataset lists MIT. The host has no robots.txt.",
  parts: { easy: { name: 'Easy', unit: '%' }, medium: { name: 'Medium', unit: '%' }, hard: { name: 'Hard', unit: '%' } },
  stats: {
    wordPercentile: { name: 'Word percentile', unit: '%', better: 'higher' },
    possibleWords: { name: 'Possible words', unit: 'count' },
    medianTurnSeconds: { name: 'Median turn time', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    return checkedImageRows(feed, 'faa19b14fa87349500740711dd206deaf7045aa3cd730bc010d6cfd1db47fd6f',
      standings.map(([model, score, wordPercentile, easy, medium, hard, possibleWords, medianTurnSeconds]) => ({
        model, score, metrics: { wordPercentile, easy, medium, hard, possibleWords, medianTurnSeconds },
      })));
  },
};
export default board;
