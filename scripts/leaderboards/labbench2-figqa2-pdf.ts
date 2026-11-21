// LABBench2 FigQA2 PDF tests scientific figure understanding when the source paper PDF is provided.
// The Edison benchmark page reports average score for each model and tool setting in file mode.
// This importer reads the ten published runs from the official results table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = 'https://advances.edisonscientific.com/benchmarks/labbench2/figqa2-pdf/';
function compact(value: string): number {
  const match = value.match(/([\d.]+)k/i);
  return match ? Number(match[1]) * 1000 : Number(value);
}
const board: Leaderboard = {
  benchmark: 'labbench2-figqa2-pdf', url: FEED, feed: FEED,
  terms: 'The Edison Scientific benchmark page is publicly readable. Link and attribute the source.',
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  aliases: { 'gemini-3-pro-preview': 'gemini-3-pro' },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = tables(await fetchText(FEED)).find((rows) => rows[0]?.[1]?.text === 'Model ↕');
    if (!table || table.length !== 11) throw new Error('LABBench2 FigQA2 PDF results table missing or incomplete');
    return table.slice(1).map((cells) => {
      const score = num(cells[4].text);
      const duration = cells[6].text.match(/([\d.]+)(m|s)/);
      if (!cells[1].text || score === undefined || !duration) throw new Error('Invalid LABBench2 FigQA2 PDF result');
      return { model: cells[1].text, setting: cells[2].text === '—' ? undefined : cells[2].text, harness: cells[3].text, score, date: cells[7].text, tokens: compact(cells[5].text), metrics: { durationSeconds: Number(duration[1]) * (duration[2] === 'm' ? 60 : 1) } };
    });
  },
};
export default board;
