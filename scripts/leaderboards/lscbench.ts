// LSCBench (Last Secure Code Benchmark, 450 tasks). The leaderboard is the markdown table under
// "## Leaderboard" in the alibaba/last-secure-code-benchmark README (the project site shows the same rows):
// per model and agent, FuncPass, SecPass and Func∧Sec, the share of tasks whose functional and security
// suites both pass (0 to 100), which is the board's headline and the score here. The agent is the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/alibaba/last-secure-code-benchmark/main/README.md';

const board: Leaderboard = {
  benchmark: 'lscbench',
  url: 'https://last-secure-code-benchmark.github.io',
  feed: `${FEED} (Leaderboard table, Func∧Sec)`,
  terms: 'README table in the alibaba/last-secure-code-benchmark repository, licensed Apache-2.0.',
  aliases: {},
  async fetch() {
    const md = await fetchText(FEED);
    const section = md.slice(md.indexOf('## Leaderboard'));
    const lines = section.split('\n').filter((l) => l.startsWith('|'));
    const head = lines[0]?.split('|').slice(1, -1).map((c) => c.trim());
    const col = head?.indexOf('Func∧Sec') ?? -1;
    if (head?.[0] !== 'Model' || head?.[1] !== 'Agent' || col < 0) throw new Error(`unexpected LSCBench header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(2)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.replace(/\*/g, '').trim());
      const score = num(cells[col]);
      if (!cells[0] || score === undefined) continue;
      rows.push({ model: cells[0], harness: cells[1] || undefined, score });
    }
    return rows;
  },
};
export default board;
