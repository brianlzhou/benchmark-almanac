// DeepTerminalBench (UniPat AI, part of the Terminal-X suite). The Terminal-X post on unipat.ai is
// server-rendered and carries one results table per member benchmark; the DeepTerminalBench table is the one
// headed Pass@1: per model, pass@1 over the 50 tasks (the ranking, 0 to 100), pass and fail counts, turns and
// output tokens per task in thousands. Pass@1 is the score. The section says every run uses the terminus-2
// agent, so that is the harness. The post is dated 2026-05-02, the date the runs were published.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://unipat.ai/blog/TerminalX';
const DATE = '2026-05-02';

const board: Leaderboard = {
  benchmark: 'deepterminalbench',
  url: URL,
  feed: `${URL} (DeepTerminalBench table, Pass@1)`,
  terms: 'Server-rendered page on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Pass@1') && rows[0]?.some((c) => c.text === 'Model'));
    if (!t) throw new Error('DeepTerminalBench table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iScore, iTok] = [head.indexOf('Model'), head.indexOf('Pass@1'), head.findIndex((h) => /^Output Tok/.test(h))];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[iModel]?.text.trim();
      const score = num(r[iScore]?.text);
      if (!model || score === undefined) continue;
      const tok = iTok >= 0 ? num(r[iTok]?.text) : undefined;
      rows.push({ model, score, harness: 'terminus-2', date: DATE, tokens: tok !== undefined ? tok * 1000 : undefined });
    }
    return rows;
  },
};
export default board;
