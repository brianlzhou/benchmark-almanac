// SeniorTalk evaluates Chinese speech from older adults. Its README lists speech recognition first.
// The headline is character error rate. The other tasks test different models and use different metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/flageval-baai/SeniorTalk/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'seniortalk', url: 'https://github.com/flageval-baai/SeniorTalk', feed,
  terms: 'The authors publish these tables in the SeniorTalk README. https://github.com/flageval-baai/SeniorTalk#code-access-control',
  headline: 'The headline is character error rate on speech recognition, the first task. Lower values indicate fewer errors.',
  parts: Object.fromEntries(['No', 'Light', 'Moderate', 'Heavy', 'South', 'North'].map(name => [name, {name, unit: '%', better: 'lower' as const}])),
  async fetch() {
    const section = (await fetchText(feed)).split('ASR Results')[1]?.split('SV Results')[0];
    if (!section?.includes('Zero-shot | Fine-tuning') || !/CER\s*\| No\s*\| Light\s*\| Moderate\s*\| Heavy\s*\| South\s*\| North/.test(section)) throw new Error('Missing ASR columns');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      if (!/^\|[^|]+\|\s*[\d,.]+M\s*\|/.test(line)) continue;
      const [model, size, ...values] = line.split('|').slice(1,-1).map(cell => cell.trim());
      const params = Number(size.replace(/[M,]/g, '')) / 1000;
      const scores = values.map(Number);
      if (!scores.every(Number.isFinite)) throw new Error('Invalid SeniorTalk result');
      if (scores.length === 7) {
        const metrics = Object.fromEntries(Object.keys(board.parts!).map((key,i) => [key,scores[i+1]]));
        rows.push({model, params, setting: 'Trained from scratch', score: scores[0], metrics});
      } else if (scores.length === 2) {
        ['Zero-shot', 'Fine-tuning'].forEach((setting,i) => rows.push({model, params, setting, score: scores[i]}));
      } else throw new Error('Unexpected ASR row');
    }
    return checked(rows, 15);
  },
};
export default board;
