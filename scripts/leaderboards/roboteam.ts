// RoboTeam tests coordination of robot arms across 36 simulated tasks. Table S3 reports completed tasks and resource use.
// The score is the percentage of tasks completed. Table S5 supplies 95% intervals for matched conditions.
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { text } from '../lib/html.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const feed = 'https://arxiv.org/html/2611.22138';
const pct = (n: number) => 100 * n / 36;
const stats = {
  tasksCompleted: { name: 'Tasks completed', unit: 'count' }, totalTimeHours: { name: 'Total time', unit: 'hours', better: 'lower' as const }, inputTokens: { name: 'Input tokens per task', unit: 'tokens' }, cachedPercent: { name: 'Cached input percentage', unit: '%' },
  timeHoursMedian: { name: 'Median time per task', unit: 'hours', better: 'lower' as const }, timeHoursP25: { name: '25th percentile time per task', unit: 'hours', better: 'lower' as const }, timeHoursP75: { name: '75th percentile time per task', unit: 'hours', better: 'lower' as const },
  messagesMedian: { name: 'Median messages per task', unit: 'count' }, messagesP25: { name: '25th percentile messages per task', unit: 'count' }, messagesP75: { name: '75th percentile messages per task', unit: 'count' }, toolCallsMedian: { name: 'Median tool calls per task', unit: 'count' }, toolCallsP25: { name: '25th percentile tool calls per task', unit: 'count' }, toolCallsP75: { name: '75th percentile tool calls per task', unit: 'count' },
  atomicFailurePercentMedian: { name: 'Median atomic failure percentage', unit: '%', better: 'lower' as const }, atomicFailurePercentP25: { name: '25th percentile atomic failure percentage', unit: '%' }, atomicFailurePercentP75: { name: '75th percentile atomic failure percentage', unit: '%' }, failedGrasps: { name: 'Failed grasps', unit: 'count' }, grasps: { name: 'Grasps', unit: 'count' }, failedGraspPercent: { name: 'Failed grasp percentage', unit: '%', better: 'lower' as const },
};
const board: Leaderboard = {
  benchmark: 'roboteam', url: feed, feed, static: 'paper', aliases: {'opus-5.5': 'claude-opus-5-5'},
  terms: 'The paper is available under the terms linked at https://arxiv.org/abs/2611.22138.', stats,
  async fetch() {
    const html = await paperHtml(feed);
    const source = paperTables(html).map(grid);
    const main = source.find(t => t[0].join('|') === '|Tasks|Time per task|Total|Input|Output||Messages|Tool calls|Atomic failure|Failed grasps');
    const ci = source.find(t => t[1]?.join('|') === '|completed|Adaptive|condition|p');
    const adaptive = text(html).match(/adaptive system completes 28 tasks, with a 95% interval of (\d+) to (\d+)/i);
    if (!main || !ci || !adaptive) throw new Error('Missing RoboTeam Table S3 or S5');
    let group = '';
    const rows: LeaderboardRow[] = [];
    for (const row of main.slice(2)) {
      const label = row[0];
      if (new Set(row).size === 1) { group = label; continue; }
      if (label === 'Oracle') continue;
      const named = /^(In Claude Code|Other models)/.test(group);
      const model = named ? label : 'gpt-6.1-sol';
      const harness = group.startsWith('In Claude Code') ? 'Claude Code' : 'Codex';
      const setting = named ? 'Adaptive' : label;
      const comparison = named ? model + ' , ' + harness : setting;
      const interval = !named && setting === 'Adaptive' ? adaptive : ci.find(r => r[0] === comparison)?.[1].match(/\((\d+)–(\d+)\)/);
      const tokens = Math.round(numberCell(row[5]) * 1e6 / 36);
      const metrics: Record<string, number> = {tasksCompleted: numberCell(row[1]), totalTimeHours: numberCell(row[3]),
        inputTokens: numberCell(row[4]) * 1e9 / 36, cachedPercent: numberCell(row[6].replace('%',''))};
      for (const [col, key] of [[2,'timeHours'],[7,'messages'],[8,'toolCalls'],[9,'atomicFailurePercent']] as const) {
        const range = row[col].replace(/[,%]/g,'').match(/^([\d.]+) \(([\d.]+)–([\d.]+)\)$/);
        if (!range) throw new Error('Missing median or quartiles for ' + key);
        metrics[key + 'Median'] = Number(range[1]); metrics[key + 'P25'] = Number(range[2]); metrics[key + 'P75'] = Number(range[3]);
      }
      const grasps = row[10].replaceAll(',','').match(/^(\d+)\/(\d+) \(([\d.]+)%\)$/);
      if (!grasps) throw new Error('Invalid grasp counts');
      Object.assign(metrics, {failedGrasps: Number(grasps[1]), grasps: Number(grasps[2]), failedGraspPercent: Number(grasps[3])});
      rows.push({model, harness, setting, score: pct(metrics.tasksCompleted), tokens, metrics,
        ...(interval && {low: pct(Number(interval[1])), high: pct(Number(interval[2]))})});
    }
    return checked(rows, 13);
  },
};
export default board;
