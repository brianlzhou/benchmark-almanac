// EduClaw-Bench tests tutoring over 30 days. Tables 3 and 4 report signed change in solve rate first.
// The remaining axes use different scales, so the headline is the change in solve rate in percentage points.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2608.03206';
const axes = ['\\DeltaSolve', 'Resp', 'Help', 'Gagné', 'Rosen.'];
const board: Leaderboard = {
  benchmark: 'educlaw-bench', feed, url: feed, static: 'paper', harnesses: 'system',
  terms: 'The paper and its terms are available at https://arxiv.org/abs/2608.03206.',
  headline: 'The paper reports five separate axes. The headline is the change in learner solve rate, in percentage points.',
  aliases: { 'Solar-pro3': 'solar-pro-3', 'Codex-gpt5.5': 'gpt-5-5', 'Qwen3-4B-Thinking': 'qwen3-4b-thinking-2507' },
  parts: { responsiveness: { name: 'Responsiveness', unit: '%' }, helpfulness: { name: 'Helpfulness', unit: 'score' },
    gagne: { name: 'Gagné', unit: 'score' }, rosenshine: { name: 'Rosenshine', unit: 'score' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const baseline = tables.find(t => t[1]?.slice(1).join('|') === [...axes, ...axes, ...axes].join('|'));
    const trained = tables.find(t => t[0]?.slice(1).join('|') === axes.join('|'));
    if (!baseline || !trained) throw new Error('Missing EduClaw-Bench Tables 3 or 4');
    const rows: LeaderboardRow[] = [];
    function add(model: string, harness: string, setting: string, trials: number, cells: string[]) {
      if (cells.length !== 5 || cells.some(c => !/^[+-]?\d+(?:\.\d+)?$/.test(c))) throw new Error('Unexpected tutor result');
      const [score, responsiveness, helpfulness, gagne, rosenshine] = cells.map(Number);
      rows.push({ model, harness, setting, trials, score, metrics: { responsiveness, helpfulness, gagne, rosenshine } });
    }
    for (const [harness, ...cells] of baseline.slice(3)) {
      if (cells.length !== 15) throw new Error('Incomplete tutor tier');
      for (let i = 0; i < 15; i += 5) {
        add(baseline[0][i + 1].split(' (')[0], harness, 'Untrained', 220, cells.slice(i, i + 5));
      }
    }
    const start = trained.findIndex(r => r[0] === 'Trained (LoRA RFT, epoch-averaged)');
    if (start < 0) throw new Error('Missing LoRA RFT section');
    for (const [harness, ...cells] of trained.slice(start + 1)) add('Qwen3-4B-Thinking', harness, 'LoRA RFT, epoch average', 275, cells);
    return checked(rows, 32);
  },
};
export default board;
