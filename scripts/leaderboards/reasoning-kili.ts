// Kili tests reasoning across five proficiency levels. The headline is overall accuracy.
// Two transcriptions of Kili's four labeled charts agreed. Each chart has a separate SHA-256 guard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const base = 'https://cdn.prod.website-files.com/6703aac5c10802b232ec6dbf/';
const charts = [
  ['67dadfdaca5d1f24bafa5c3a_Frame%2040042%20(1).svg', 'b532183656b57ffbc6fdb04dad90ee37b928243b0bef94a0ca3aba02a40dcb5f'],
  ['67d1b38252095bf7ed885ed2_Frame%2040043.svg', 'c3244e07d5e91f5abb3aa989ffad6a67f34ef9003af33a32891315672a937693'],
  ['67d1b38236bd17e068775821_Frame%2040044.svg', '7b799b36143064c511e2e01326077119d78d094b2f59e9a43823e94bbd00976c'],
  ['67d1b382f88763237fab6b76_Frame%2040045.svg', '4cc4d921fa4ad004b0736cccc08b57b7930725a4ae47dbecb127ba4fd0a02852'],
];
const results: [string, number, number, number, number][] = [
  ['o3 Mini', 84, 90.32, 81.25, 75],
  ['Claude 3.7', 84, 80.65, 87.50, 83.33],
  ['o1', 73.33, 64.52, 75, 91.67],
  ['QwQ-32B', 62.67, 51.61, 75, 58.33],
  ['Mistral-Large-2411', 58.67, 51.61, 65.63, 58.33],
  ['DeepSeek R1', 57.33, 58.06, 68.75, 25],
  ['Claude 3.5', 50.67, 45.16, 56.25, 50],
  ['Qwen 2.5', 45.33, 35.48, 59.38, 33.33],
];
const board: Leaderboard = {
  benchmark: 'reasoning-kili',
  url: 'https://llmbenchmark.kili-technology.com/',
  feed: base + charts[0][0],
  terms: 'Kili Technology publishes these charts at https://llmbenchmark.kili-technology.com/ and retains rights to its report.',
  parts: { math: 'Math', reasoning: 'Reasoning', language: 'Language' },
  aliases: { 'Claude 3.7': 'claude-3-7-sonnet', 'DeepSeek R1 (snapshot unspecified)': 'deepseek-r1' },
  async fetch() {
    for (const [i, [path, hash]] of charts.entries()) {
      if (i) await new Promise(resolve => setTimeout(resolve, 1000));
      await chartRows(base + path, hash, []);
    }
    const rows: LeaderboardRow[] = results.map(([model, score, math, reasoning, language]) =>
      ({ model, score, metrics: { math, reasoning, language } }));
    return checked(rows, 8);
  },
};
export default board;
