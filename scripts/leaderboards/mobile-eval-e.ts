// Mobile-Eval-E tests agents on 25 smartphone tasks. Satisfaction Score measures
// the percentage of requirements fulfilled. Tables 3 and 4 compare agent frameworks
// and reasoning backbones, and Table 5 reports their speed and shortcut usage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2501.11733';
const board: Leaderboard = {
  benchmark: 'mobile-eval-e', static: 'paper', url: feed, feed, harnesses: 'system',
  stats: { actionAccuracy: {name:'Action accuracy',unit:'%',better:'higher'}, reflectionAccuracy: {name:'Reflection accuracy',unit:'%',better:'higher'}, terminationError: {name:'Termination error',unit:'%',better:'lower'}, reasoningSecondsPerOperation: {name:'Reasoning time per operation',unit:'seconds',better:'lower'}, totalSecondsPerOperation: {name:'Total time per operation',unit:'seconds',better:'lower'}, shortcutUsage: {name:'Shortcut usage',unit:'%',better:'lower'} },
  terms: 'Paper and license details at https://arxiv.org/abs/2501.11733.',
  aliases: { 'gpt-4o-2024-11-20': 'gpt-4o-nov-2024', 'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const baseline = tables.find(t => t[0][2]?.startsWith('Satisfaction Score'));
    const multi = tables.find(t => t[0][1] === 'Gemini-1.5-pro' && t[0][5] === 'Claude-3.5-Sonnet' && t[0][9] === 'GPT-4o');
    const speed = tables.find(t => t[0][0].startsWith('Inference Speed') && t[1][4] === 'Perception + Reasoning');
    const usage = tables.find(t => t[0][0].startsWith('Shortcut Usage Percentage'));
    if (!baseline || !multi || !speed || !usage || multi[1].slice(1).map(v => v.split('\\')[0]).join() !== Array(3).fill('SS,AA,RA,TE').join()) {
      throw new Error('Missing Mobile-Eval-E comparison columns');
    }
    const models = ['gemini-1.5-pro-latest (Dec 2024)', 'claude-3-5-sonnet-20241022', 'gpt-4o-2024-11-20'];
    const rows: LeaderboardRow[] = [];
    for (const r of multi.slice(2)) {
      const harness = r[0].split(' (')[0];
      const timing = speed.find(line => line[0] === harness);
      const shortcuts = usage.find(line => line[0] === harness);
      if (!timing) throw new Error('Missing timing row for ' + harness);
      models.forEach((model, i) => {
        const [score, actionAccuracy, reflectionAccuracy, terminationError] = r.slice(1 + i * 4, 5 + i * 4).map(numberCell);
        const metrics: Record<string, number> = { actionAccuracy, reflectionAccuracy, terminationError,
          reasoningSecondsPerOperation: numberCell(timing[1 + i]), totalSecondsPerOperation: numberCell(timing[4 + i]) };
        if (shortcuts) metrics.shortcutUsage = numberCell(shortcuts[i + 1]);
        rows.push({ model, harness, score, metrics });
      });
    }
    for (const r of baseline.slice(1)) {
      if (r[1] !== 'Single-Agent') continue;
      rows.push({ model: models[2], harness: r[0].split(' (')[0], score: numberCell(r[2]),
        metrics: { actionAccuracy: numberCell(r[3]), terminationError: numberCell(r[5]) } });
    }
    return checked(rows, 11);
  },
};
export default board;
