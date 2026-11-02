// AgentIF under its original setting (gpt-4o-2024-11-20 judge, greedy decoding). agentif.github.io keeps
// that board as the second table on the page, below the October 2026 setting that agentif-2026-10.ts reads.
// Columns: # | Model | six constraint-type columns | ISR | CSR. CSR (constraint success rate, 0 to 100)
// is the last cell and the score, as on the current board. A tag before the name marks the mode: [T]
// thinking, [N] non-thinking. Each model links to its results zip, whose file name may carry a snapshot date
// ("gpt-4o-2024-11-20"), used as the row date. Rows without one take the paper's date (arXiv 2505.16944).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const PAGE = 'https://agentif.github.io/';
const PAPER_DATE = '2025-05-22';

/** "gpt-4o-2024-11-20" or "claude-3-5-sonnet-20241022" in a file name, as YYYY-MM-DD. */
const snapshot = (href: string) => {
  const m = href.match(/(20\d\d)-?([01]\d)-?([0-3]\d)(?!\d)/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
};

const board: Leaderboard = {
  benchmark: 'agentif',
  url: PAGE,
  feed: `${PAGE} (static HTML, second leaderboard table, CSR)`,
  terms: 'Static GitHub Pages site that states no terms; the AgentIF code is Apache-2.0 and the dataset CC BY 4.0.',
  aliases: {
    // the results file is claude-3-5-sonnet-20241022
    'Claude-3-5-Sonnet': 'claude-3-5-sonnet-october-2024',
    'Meta-Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Meta-Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Mistral-7B-Instruct-v0.3': 'mistral-7b-v0-3',
  },
  async fetch() {
    const table = [...(await fetchText(PAGE)).matchAll(/<table\b[\s\S]*?<\/table>/g)][1]?.[0];
    if (!table) throw new Error('no second (original setting) table on the AgentIF page');
    const head = text(table.match(/<tr\b[^>]*>(?:(?!<\/tr>)[\s\S])*?\bCSR\b[\s\S]*?<\/tr>/)?.[0] ?? '');
    if (!/ISR CSR$/.test(head)) throw new Error(`unexpected AgentIF header: ${head}`);
    const rows: LeaderboardRow[] = [];
    for (const tr of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = [...tr[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]);
      const link = cells[1]?.match(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
      const score = num(text(cells.at(-1) ?? ''));
      if (!link || score === undefined) continue;
      const tag = cells[1].match(/\[([TN])\]/)?.[1];
      rows.push({
        model: text(link[2]),
        score,
        setting: tag === 'T' ? 'thinking' : tag === 'N' ? 'non-thinking' : undefined,
        date: snapshot(link[1]) ?? PAPER_DATE,
      });
    }
    if (!rows.length) throw new Error('no rows in the AgentIF original-setting table');
    return rows;
  },
};
export default board;
