// Voice Arena Goal Dataset evaluates judges on pairwise human preferences for task-oriented voice calls.
// The dataset card reproduces the paper's Table 3, with Task accuracy as the headline and Humanness as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/VoiceArena/Goal-Dataset_en_in/raw/main/README.md';
const board: Leaderboard = {
  benchmark: 'voice-arena-goal-dataset', static: 'paper', url: 'https://huggingface.co/datasets/VoiceArena/Goal-Dataset_en_in', feed: FEED,
  terms: 'The dataset card is released under its stated Hugging Face terms and cites the Voice Arena paper. https://huggingface.co/datasets/VoiceArena/Goal-Dataset_en_in',
  headline: 'The paper reports Task and Humanness accuracy, so this headline uses the Task column.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    const section = text.split('Pairwise accuracy (%) on pairs with a majority label')[1]?.split('## Notes')[0];
    if (!section) throw new Error('Voice Arena Table 3 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const cells = line.trim().split('|').map((cell) => cell.trim());
      if (cells.length < 5 || !cells[1] || cells[1] === 'Judge' || /Duration baseline|Human ceiling/.test(cells[1])) continue;
      const task = Number(cells[3].replace('†', ''));
      const humanness = Number(cells[4].replace('†', ''));
      if (!Number.isFinite(task) || !Number.isFinite(humanness)) continue;
      rows.push({ model: cells[1], setting: cells[2], score: task, metrics: { humanness } });
    }
    if (rows.length < 3) throw new Error(`Voice Arena model rows missing: ${rows.length}`);
    return rows;
  },
};
export default board;
