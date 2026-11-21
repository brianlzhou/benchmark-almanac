// ArxivRollBench tests sequencing, cloze and next-fragment prediction on fresh papers.
// The makers rank models by pooled accuracy among nonempty answers in the 2026a results file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

type Accuracy = { validAcc: number, validStderr: number, rawAcc: number, rawStderr: number, coverage: number, nonNull: number, total: number };
type Summary = Accuracy & { scoreName: string, byTask: Record<string, Accuracy> };
const feed = 'https://raw.githubusercontent.com/liangzid/arxivbenchleaderboard/HEAD/public/2026a.json';
const taskNames: Record<string, string> = { s: 'Sequencing', c: 'Cloze', p: 'Prediction' };
const board: Leaderboard = {
  benchmark: 'arxivrollbench', url: 'https://arxivroll.moreoverai.com', feed,
  aliases: { 'deepseek/deepseek-chat-v3.1': 'deepseek-v3-1' },
  terms: 'The makers publish their leaderboard under GitHub’s terms at https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  async fetch() {
    const results = await fetchJson<Record<string, { __summary: Summary }>>(feed);
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    for (const [model, { __summary: summary }] of Object.entries(results)) {
      if (summary?.scoreName !== 'pooled_valid_acc') throw new Error('Missing pooled accuracy column');
      if (summary.nonNull === 0) continue;
      const metrics: Record<string, number> = {
        stderr: 100 * summary.validStderr, coverage: 100 * summary.coverage, rawAccuracy: 100 * summary.rawAcc,
        rawStderr: 100 * summary.rawStderr, validAnswers: summary.nonNull, totalItems: summary.total,
      };
      const tasks = Object.entries(summary.byTask);
      if (tasks.length !== 24) throw new Error('Expected 24 subject and task combinations');
      for (const [name, task] of tasks) {
        const match = /^robench2026a_all_set(.+)SCP-([scp])(?:-50)?$/.exec(name);
        if (!match) throw new Error('Unknown task ' + name);
        const key = match[1] + '-' + match[2];
        parts[key] = match[1] + ': ' + taskNames[match[2]];
        if (task.nonNull > 0) metrics[key] = 100 * task.validAcc;
      }
      const setting = tasks.every(([name]) => name.endsWith('-50')) ? '2026a, 50-item task samples' : '2026a, full tasks';
      rows.push({ model, setting, score: 100 * summary.validAcc, metrics });
    }
    board.parts = parts;
    return checked(rows, 39);
  },
};
export default board;
