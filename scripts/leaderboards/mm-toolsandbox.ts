// MM-ToolSandbox tests visual agents on 258 tool-use scenarios. Table 2 reports
// agent success, entity F1 and mean steps. Table 12 breaks down success by image source.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2607.11818';
const board: Leaderboard = {
  benchmark: 'mm-toolsandbox',
  url: feed,
  feed,
  static: 'paper',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2607.11818.',
  stats: { entityF1: { name: 'Entity F1', unit: 'score', better: 'higher' }, steps: { name: 'Average steps', unit: 'count', better: 'lower' } },
  parts: { rich: 'Natural (text-rich)', less: 'Natural (less text)', docs: 'Docs/Charts/Tables', ui: 'UI' },
  aliases: { 'KIMI 2.6': 'kimi-k2-6', 'Claude 4.5 Sonnet': 'claude-sonnet-4-5', 'Claude 4.5 Opus': 'claude-opus-4-5' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(table => table[0].length === 4 && table[0][1].startsWith('Agent Success Rate') && table[0][2].startsWith('Entity F1') && table[0][3].startsWith('Avg. Steps'));
    if (!table) throw new Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const label = cells[0].replace(/ \( [^()]+, \d{4}[a-z]? \)$/, '');
      const model = label.split(' (')[0];
      const setting = label.match(/\(([^)]+)\)$/)?.[1] ?? 'thinking';
      const score = Number((numberCell(cells[1]) * 100).toFixed(2));
      const metrics: Record<string, number> = { entityF1: numberCell(cells[2]), steps: numberCell(cells[3]) };
      const short: Record<string, string> = { 'KIMI 2.6': 'KIMI 2.6', 'GLM 4.6V': 'GLM 4.6V', 'Qwen 3.5-397B-A17B': 'Qwen 3.5-397B',
        'GPT-5.4 (thinking-high)': 'GPT-5.4', 'Claude 4.5 Sonnet': 'Sonnet 4.5', 'Claude 4.5 Opus': 'Opus 4.5' };
      if (short[label]) {
        const image = tables.find(t => t[0][0] === 'Category' && t[0][1] === 'n');
        const index = image?.[0].indexOf(short[label]) ?? -1;
        if (!image || index < 2 || Number((numberCell(image.at(-1)![index]) * 100).toFixed(2)) !== score) throw new Error('Image category model mismatch');
        const labels = ['Natural (text-rich)', 'Natural (less text)', 'Docs/Charts/Tables', 'UI'];
        ['rich', 'less', 'docs', 'ui'].forEach((key, i) => {
          const row = image.find(row => row[0] === labels[i]);
          metrics[key] = Number((numberCell(row?.[index] ?? '') * 100).toFixed(2));
        });
      }
      rows.push({ model, setting, harness: 'Code-Execution', score, metrics });
    }
    return checked(rows, 14);
  },
};
export default board;
