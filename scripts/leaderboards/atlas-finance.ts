// ATLAS-Finance: task pass rate, distinct from rubric score and pass@3.
// Reads the full Sanity leaderboard JSON embedded on the page (all 25 models and all 9 columns,
// including 95% CI bounds, pass@3, rubric score, per-task cost, average rollout time, input tokens
// per task and output tokens per attempt) plus the page's Performance vs. cost scatter chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt, num } from '../lib/html.ts';

const PAGE = 'https://joinhandshake.com/research/benchmarks/atlas-finance/';

interface SanityCell {
  content?: { children?: { text?: string }[] }[];
}
interface SanityRow {
  cells?: SanityCell[];
}

function cellLines(cell: SanityCell | undefined): string[] {
  return (cell?.content ?? [])
    .map((block) => (block.children ?? []).map((span) => span.text ?? '').join('').trim())
    .filter(Boolean);
}

const board: Leaderboard = {
  benchmark: 'atlas-finance',
  url: PAGE,
  feed: PAGE,
  terms: 'Handshake terms restrict automated extraction. Benchmark Almanac credits Handshake and links the original source.',
  stats: {
    passAt3: { name: 'Pass@3', unit: '%', better: 'higher' },
    rubric: { name: 'Rubric score', unit: '%', better: 'higher' },
    minutes: { name: 'Average rollout time', unit: 'minutes', better: 'lower' },
    inputTokens: { name: 'Input tokens per task', unit: 'tokens', better: 'lower' },
  },
  chart: {
    title: 'Performance vs. cost',
    x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Pass rate', unit: '%', better: 'higher' },
    note: 'Handshake ATLAS-Finance Performance vs. cost scatter plot.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const anchor = html.indexOf('"csvFilename":"ATLAS-Finance-Leaderboard');
    if (anchor < 0) throw new Error('ATLAS-Finance embedded leaderboard JSON missing');
    const rowsAt = html.indexOf('"rows":[', anchor);
    if (rowsAt < 0) throw new Error('ATLAS-Finance rows array missing');
    const rawRows = jsonAt<SanityRow[]>(html, rowsAt + '"rows":'.length);

    const rows: LeaderboardRow[] = [];
    for (const r of rawRows) {
      const cells = r.cells ?? [];
      if (cells.length < 6) continue;
      const nameLines = cellLines(cells[0]);
      const model = nameLines[0];
      const score = num(cellLines(cells[1])[0]);
      if (!model || score === undefined) continue;

      const settingMatch = nameLines[1]?.match(/·\s*(.+)$/);
      const setting = settingMatch?.[1]?.trim().toLowerCase() || undefined;
      const ciMargin = num(cellLines(cells[2])[0]);
      const passAt3 = num(cellLines(cells[3])[0]);
      const rubric = num(cellLines(cells[4])[0]);
      const cost = num(cellLines(cells[5])[0]);
      const minutes = num(cellLines(cells[6])[0]);
      const inputTokens = num(cellLines(cells[7])[0]);
      const tokens = num(cellLines(cells[8])[0]);

      const metrics: Record<string, number> = {};
      if (passAt3 !== undefined) metrics.passAt3 = passAt3;
      if (rubric !== undefined) metrics.rubric = rubric;
      if (minutes !== undefined) metrics.minutes = minutes;
      if (inputTokens !== undefined) metrics.inputTokens = inputTokens;

      rows.push({
        model,
        setting,
        score,
        ...(ciMargin !== undefined ? { low: Number((score - ciMargin).toFixed(2)), high: Number((score + ciMargin).toFixed(2)) } : {}),
        ...(cost !== undefined ? { cost } : {}),
        ...(tokens !== undefined ? { tokens } : {}),
        metrics,
      });
    }
    if (rows.length < 20) throw new Error(`Expected at least 20 ATLAS-Finance rows, got ${rows.length}`);
    return rows;
  },
};

export default board;
