// FrontierCS 1.0 (algorithmic problems). frontier-cs.org now opens on FrontierCS 2; the first benchmark lives
// at /v1/, a static page with three leaderboard tabs. "Version 1.1" (179 problems, a new scoring rule that
// keeps rewarding answers beyond the reference) is a different task set and scoring, so it is not read
// here. The two "kept as they were" version 1.0 tabs are this record: "Version 1.0 single attempt" (one
// program per problem, the paper's setting; score is Score@1, the mean problem score of one attempt) and
// "Version 1.0 agents" (Harbor agent runs of up to 5 hours keeping the best submission; score is Score, with
// the agent as the harness). Both are 0 to 100 problem-score means. The Human experts row is skipped.
// The tabs' other columns go in `metrics`: Avg@5, Score@5 and Elo on the single-attempt tab ("avg5", "score5",
// "elo"), and Avg steps and Avg tool calls on the agents tab ("steps", "toolCalls"). Avg tokens does not
// separate output tokens, so it is preserved as metrics.totalTokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, num, type Cell } from '../lib/html.ts';

const PAGE = 'https://frontier-cs.org/v1/';

function nameAndHarness(cell: Cell): { model: string; harness?: string } {
  const inner = cell.html.match(/<span>([\s\S]*?)<\/span>\s*<\/span>/)?.[1] ?? cell.html;
  const [name, small] = inner.split(/<small>/);
  return { model: text(name), harness: small ? text(small) || undefined : undefined };
}

/** The named columns of one table row as metrics (metrics key -> column header), when they hold numbers. */
function extras(table: Cell[][], row: Cell[], cols: Record<string, string>): Pick<LeaderboardRow, 'metrics'> {
  const head = table[0].map((c) => c.text);
  const metrics: Record<string, number> = {};
  for (const [k, h] of Object.entries(cols)) {
    const raw = row[head.indexOf(h)]?.text;
    const suffix = raw?.match(/^([\d.]+)([KM])$/i);
    const v = suffix ? Number(suffix[1]) * (suffix[2].toUpperCase() === 'M' ? 1e6 : 1e3) : num(raw);
    if (head.includes(h) && v !== undefined) metrics[k] = v;
  }
  return Object.keys(metrics).length ? { metrics } : {};
}

const board: Leaderboard = {
  benchmark: 'frontiercs',
  url: PAGE,
  feed: `${PAGE} (static HTML: "Version 1.0 single attempt" Score@1 and "Version 1.0 agents" Score)`,
  terms: 'Static project page; robots.txt allows every path and the FrontierCS site and repository are MIT-licensed.',
  aliases: {
    'DeepSeek 3.2': 'deepseek-v3-2',
    'Kimi K2.6': 'kimi-k2-6',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const all = tables(await fetchText(PAGE));
    const head = (t: Cell[][]) => t[0]?.map((c) => c.text) ?? [];
    const single = all.find((t) => head(t).includes('Score@1') && head(t).includes('Elo'));
    const agents = all.find((t) => head(t).includes('Avg steps'));
    if (!single || !agents) throw new Error('FrontierCS 1.0 tables not found');
    const rows: LeaderboardRow[] = [];
    const iS = head(single).indexOf('Score@1');
    for (const r of single.slice(1)) {
      const { model } = nameAndHarness(r[1]);
      const score = num(r[iS]?.text);
      if (/human/i.test(model) || score === undefined) continue;
      rows.push({ model, score, ...extras(single, r, { avg5: 'Avg@5', score5: 'Score@5', elo: 'Elo' }) });
    }
    const iA = head(agents).indexOf('Score');
    for (const r of agents.slice(1)) {
      const { model, harness } = nameAndHarness(r[1]);
      const score = num(r[iA]?.text);
      // one row (Kimi K2.6) names no agent; every row on this tab ran through Harbor
      if (score !== undefined) rows.push({ model, score, harness: harness ?? 'Harbor agent', ...extras(agents, r, { steps: 'Avg steps', toolCalls: 'Avg tool calls', totalTokens: 'Avg tokens' }) });
    }
    return rows;
  },
};
export default board;
