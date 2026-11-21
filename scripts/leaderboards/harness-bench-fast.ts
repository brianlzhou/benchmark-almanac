// harness-bench-fast v0.3.0 measures how many of 231 agent tasks pass their verifiers.
// The May 2026 README publishes the 231-task percentages and run dates before the Light and Medium suites replaced them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const revision = '441e5d3cabb6bd2ecc6fc72663011231a6d149a8';
const repo = 'https://github.com/ai-forever/harness-bench-fast';
const feed = 'https://raw.githubusercontent.com/ai-forever/harness-bench-fast/' + revision + '/README.md';
const board: Leaderboard = {
  benchmark: 'harness-bench-fast', url: repo + '/blob/' + revision + '/README.md#results', feed,
  terms: 'MIT License, AI Forever. ' + repo + '/blob/' + revision + '/LICENSE',
  harnesses: 'system',
  async fetch() {
    const source = await fetchText(feed);
    const header = '| # | Date | Runner | Model | Harness adapt | Result | % |';
    const table = source.split(header)[1]?.trim().split('\n\n')[0];
    if (!table) throw new Error('Missing v0.3.0 results');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split('\n').slice(1)) {
      const [, date, harness, label, adaptation, result, pct] = line.replace(/[*\x60]/g, '').trim().slice(1, -1).split('|').map(v => v.trim());
      if (label === 'unknown') continue;
      const pass = result.match(/^(\d+) \/ 231$/);
      const value = pct.match(/^([\d.]+) %$/);
      if (!pass || !value) throw new Error('Unexpected v0.3.0 result');
      const [model, detail] = label.split(' (');
      const setting = ['v0.3.0', detail?.replace(/\)$/, ''), 'Harness adaptation: ' + adaptation].filter(Boolean).join(', ');
      rows.push({ model, harness, setting, date, score: Number(value[1]), metrics: { passed: Number(pass[1]), tasks: 231 } });
    }
    return checked(rows, 18);
  },
};
export default board;
