// CRMArena (Salesforce AI Research). The Salesforce/CRMArena-Leaderboard Space reads
// crmarena_results/all_results.csv from its repository: one row per model and agent framework (Function
// Calling, ReAct, Act) with nine task scores and "Overall", which ranks the table and is the score (0 to
// 100). The framework is the harness. The board was built for the paper (ICLR 2025 submission, late 2024), so
// rows are dated 2025-01-01 and the resolver picks the snapshots current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/Salesforce/CRMArena-Leaderboard/resolve/main/crmarena_results/all_results.csv';

const TASKS: [string, string][] = [
  ['NCR', 'New case routing'],
  ['HTU', 'Handle time understanding'],
  ['TCU', 'Transfer count understanding'],
  ['NED', 'Name entity disambiguation'],
  ['PVI', 'Policy violation identification'],
  ['KQA', 'Knowledge question answering'],
  ['TII', 'Top issue identification'],
  ['MTA', 'Monthly trend analysis'],
  ['BRI', 'Best region identification'],
];

const board: Leaderboard = {
  benchmark: 'crmarena',
  url: 'https://huggingface.co/spaces/Salesforce/CRMArena-Leaderboard',
  feed: `${FEED} (Overall)`,
  terms: 'CSV in the Salesforce/CRMArena-Leaderboard Hugging Face Space, licensed Apache-2.0.',
  parts: Object.fromEntries(TASKS.map(([k, name]) => [k, { name, unit: '%' as const }])),
  aliases: {
    'llama3.1-405b': 'llama-3-1-405b',
    'llama3.1-70b': 'llama-3-1-70b',
    'llama3.1-8b': 'llama-3-1-8b',
    // the board lists o1 and R1 runs added in early 2025, so R1 is the January release
    'deepseek-r1': 'deepseek-r1',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const overall = Object.keys(r).find((k) => /^Overall/.test(k));
      const score = overall ? Number(r[overall]) : NaN;
      if (!r.Model || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const [k] of TASKS) {
        const v = Number(r[k]);
        if (Number.isFinite(v)) metrics[k] = v;
      }
      rows.push({
        model: r.Model.trim(),
        score,
        harness: r['Agentic Framework'] || undefined,
        date: '2025-01-01',
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
