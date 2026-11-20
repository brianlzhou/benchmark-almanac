import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
const URL = 'https://huggingface.co/spaces/oro-agents/smb-bench';
const FEED = URL + '/raw/main/data/report.json';
const CARD = 'https://huggingface.co/datasets/oro-agents/smb-bench/raw/main/README.md';
const board: Leaderboard = {
  benchmark: 'smb-bench', parts: {
  profit_customer: { name: 'Customer', group: 'Category' },
  profit_supplier: { name: 'Supplier', group: 'Category' },
  profit_normal: { name: 'Normal', group: 'Category' },
  task1_finalProfit: { name: 'Task 1', group: 'Task type' },
  task2_finalProfit: { name: 'Task 2', group: 'Task type' },
  task3_finalProfit: { name: 'Task 3', group: 'Task type' },
  task4_finalProfit: { name: 'Task 4', group: 'Task type' },
  task5_finalProfit: { name: 'Task 5', group: 'Task type' },
  task6_finalProfit: { name: 'Task 6', group: 'Task type' },
  task7_finalProfit: { name: 'Task 7', group: 'Task type' },
  task8_finalProfit: { name: 'Task 8', group: 'Task type' },
  task9_finalProfit: { name: 'Task 9', group: 'Task type' },
  task10_finalProfit: { name: 'Task 10', group: 'Task type' },
  task11_finalProfit: { name: 'Task 11', group: 'Task type' },
  task12_finalProfit: { name: 'Task 12', group: 'Task type' },
  task13_finalProfit: { name: 'Task 13', group: 'Task type' },
  task14_finalProfit: { name: 'Task 14', group: 'Task type' },
  task15_finalProfit: { name: 'Task 15', group: 'Task type' },
  task16_finalProfit: { name: 'Task 16', group: 'Task type' },
  task17_finalProfit: { name: 'Task 17', group: 'Task type' },
  task18_finalProfit: { name: 'Task 18', group: 'Task type' },
}, url: URL, feed: FEED,
  terms: 'ORO publishes these results under CC BY 4.0 for comparisons and audits. Hugging Face robots.txt permits the raw paths. No restricted grader data is read.',
  aliases: {'Muse Wonder 1.0': 'muse-wonder'},
  async fetch() {
    const d = await fetchJson<{board: {models: {key: string; name: string; runs: number; profitUsd: Record<string, number>; costPerRunUsd: number; dailyUsd: number[]; byTask: number[][]}[]}}>(FEED);
    const ts = markdownTables(await fetchText(CARD));
    const configs = ts.find(t => t[0]?.some(c => /served|model id/i.test(c)));
    const builds = ts.find(t => t[0]?.includes('Harness build'));
    const rows: LeaderboardRow[] = d.board.models.map(r => {
      const config = configs?.find(x => x[0] === r.key);
      const build = builds?.find(x => x[0].replace(' (high)', '') === r.name) ?? builds?.find(x => x[0] === 'The first nine models');
      const metrics: Record<string, number> = {validRuns: r.runs, plannedRuns: 54, tasks: 18, simulatedDays: 90};
      for (const [k, v] of Object.entries(r.profitUsd)) metrics[`profit_${k}`] = v;
      r.dailyUsd.forEach((v, i) => metrics[`profit_day${i}`] = v);
      r.byTask.forEach((v, i) => metrics[`task${i + 1}_finalProfit`] = v.at(-1)!);
      return {model: r.name, score: r.profitUsd.all, trials: 3, cost: r.costPerRunUsd,
        harness: 'ORO buyer loop', agentOrg: 'ORO',
        setting: [config?.slice(1).join('; ') ?? 'high reasoning; max output 65536', build?.slice(1).join('; ')].filter(Boolean).join('; '),
        date: build?.[5]?.match(/to (\d{4}-\d{2}-\d{2})/)?.[1] ?? build?.[5]?.match(/\d{4}-\d{2}-\d{2}/)?.[0],
        link: 'https://oroagents.com/smb-bench/runs', metrics};
    });
    if (rows.length < 3 || rows.some(r => !Number.isFinite(r.score))) throw new Error('SMB Bench results changed');
    return rows;
  },
};
export default board;
