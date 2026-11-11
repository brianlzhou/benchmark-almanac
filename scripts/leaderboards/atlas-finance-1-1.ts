// Handshake's current table explicitly identifies ATLAS-Finance v1.1.0.
// Read unrounded token counts from Sanity's table in __NEXT_DATA__, not the formatted HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const URL = 'https://joinhandshake.com/research/benchmarks/atlas-finance/';
type Block = { children?: { text?: string }[] };
type Cell = { content?: Block[] };
const blocks = (cell: Cell) => (cell.content ?? []).map(b => (b.children ?? []).map(c => c.text ?? '').join(''));
const board: Leaderboard = {
  benchmark: 'atlas-finance-1-1', url: URL, feed: `${URL} (__NEXT_DATA__ benchmarkResultsContent)`,
  terms: 'Handshake terms restrict automated extraction; the almanac credits Handshake AI Research and links the source.',
  chart: { title: 'Pass rate versus cost per attempt', x: { key: 'cost', label: 'Cost per attempt', unit: '$', better: 'lower' }, y: { key: 'score', label: 'Pass rate', unit: '%', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(URL);
    const payload = html.match(/<script\b[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!payload) throw new Error('Handshake Next payload missing');
    const post = JSON.parse(payload).props.pageProps.post;
    if (!post.featuredImage.alt.includes('v1.1.0')) throw new Error('ATLAS-Finance version changed');
    const table = post.benchmarkResultsContent[0].tableContent[0];
    const headers = table.columnHeaders.map((h: { title: string }) => h.title);
    if (headers.join('|') !== 'Model|Pass Rate|95% Confidence Interval|Pass @ 3|Rubric Score|Cost (USD) per Task|Time per Task|Input Tokens per Task|Output Tokens per Task') throw new Error('ATLAS-Finance columns changed');
    const rows = table.rows.map((r: { cells: Cell[] }) => {
      const labels = blocks(r.cells[0]);
      const values = r.cells.slice(1).map(c => Number(blocks(c)[0]));
      if (values.some(v => !Number.isFinite(v))) throw new Error('Invalid ATLAS-Finance numeric cell');
      const [score, ciMargin, pass3, rubricScore, cost, minutes, inputTokens, tokens] = values;
      return { model: labels[0], setting: labels[1]?.split('·')[1]?.trim().toLowerCase(), harness: 'OpenCode', score, cost, tokens,
        metrics: { ciMargin, pass3, rubricScore, latency: minutes * 60, inputTokens } };
    });
    if (!rows.length) throw new Error('ATLAS-Finance rows missing');
    return rows;
  },
};
export default board;
