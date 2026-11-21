// EmbodiedCLUE evaluates tabletop robot policies. The first results sheet ranks policies by success with English instructions.
// The SuperCLUE workbook also reports Chinese success rates, capability scores and run statistics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { readXlsx, SC_TERMS } from './superclue.ts';

const feed = 'https://www.superclueai.com/data/embodied_list/VLA_desk/2026%E5%B9%B44%E6%9C%88.xlsx';
const board: Leaderboard = {
  benchmark: 'embodiedclue-vla-tabletop-tasks',
  url: 'https://www.superclueai.com/embodied/VLA_desk',
  feed, terms: SC_TERMS,
  parts: {
    chinese: { name: '中文(cn)', unit: '%' },
    embedded: { name: '转化中文（embed）', unit: '%' },
    basic: '基础能力得分', adaptation: '中文适配度得分',
  },
  stats: {
    steps: { name: 'Average steps', unit: 'count' },
    reward: { name: 'Average task reward', unit: 'score', better: 'higher' },
    latency: { name: 'Average latency', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const book = readXlsx(Buffer.from(await fetchBytes(feed)));
    function table(sheet: string, columns: string[]) {
      const rows = book.get(sheet);
      if (!rows || columns.some(field => !rows[0].includes(field))) throw new Error(`Unexpected columns in ${sheet}`);
      return rows.slice(1).map(row => Object.fromEntries(rows[0].map((name, i) => [name, row[i]?.trim() ?? ''])));
    }
    const rows: LeaderboardRow[] = [];
    for (const r of table('评测成功率表', ['模型名称', '机构', '英文(en)', '中文(cn)', '转化中文（embed）'])) {
      // The last row repeats a timing record from the next sheet, with a step count in the institution column.
      if (!r['模型名称'] || /^\d+(\.\d+)?$/.test(r['机构'])) continue;
      const rate = (col: string) => {
        const value = Number(r[col]);
        if (!r[col] || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Invalid ${col} success rate`);
        return value * 100;
      };
      const metrics: Record<string, number> = { embedded: rate('转化中文（embed）') };
      if (r['中文(cn)'] !== '-') metrics.chinese = rate('中文(cn)');
      rows.push({ model: r['模型名称'], score: rate('英文(en)'), metrics });
    }
    for (const [sheet, columns] of [
      ['基础能力评测表', { steps: '平均步长', reward: '平均任务奖励', latency: '平均耗时(s)' }],
      ['基础能力得分', { basic: '总分' }], ['中文适配度得分', { adaptation: '总分' }],
    ] as [string, Record<string, string>][]) {
      for (const r of table(sheet, ['模型名称', ...Object.values(columns)])) {
        const row = rows.find(row => row.model === r['模型名称']);
        if (!row) continue;
        for (const [key, col] of Object.entries(columns)) {
          if (r[col] && Number.isFinite(Number(r[col]))) row.metrics![key] = Number(r[col]);
        }
      }
    }
    if (rows.length < 7) throw new Error('Expected at least seven tabletop policies');
    return rows;
  },
};
export default board;
