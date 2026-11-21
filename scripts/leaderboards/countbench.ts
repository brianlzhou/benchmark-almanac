// CountBench: the paper's main classification table reports overall zero-shot counting accuracy in percent.
//  These are the paper's static results and will not refresh with new model releases.
//  Each backbone has five trained variants. Mean deviation remains a metric, not a separate leaderboard row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2302.12066";

const board: Leaderboard = {
  benchmark: "countbench", static: 'paper',
  url: "https://teaching-clip-to-count.github.io/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const all = tables(await fetchText(FEED));
    const t = all.find(t => t.some(r => r[0]?.text.startsWith('Mean deviation')));
    if (!t) throw new Error('CountBench accuracy table missing');
    const acc = t.find(r => r[0]?.text.startsWith('Accuracy'))!;
    const dev = t.find(r => r[0]?.text.startsWith('Mean deviation'))!;
    const variants = ['official baseline', 'internal baseline', 'without counting loss', 'naive filtering', 'counting loss'];
    const rows: LeaderboardRow[] = Array.from({length: 10}, (_, i) => {
      const score = num(acc[i + 1]?.text);
      if (score === undefined) throw new Error('CountBench score missing');
      const variant = i === 5 ? 'public baseline' : variants[i % 5];
      return {model: `${i < 5 ? 'CLIP-B/32' : 'BASIC-S'} (${variant})`, setting: variant, score, metrics: {meanDeviation: num(dev[i + 1]?.text)!}};
    });
    for (const table of all) {
      const header = table[0]?.map(c => c.text) ?? [];
      const values = table.find(r => r[0]?.text === 'CountBench');
      if (!values || !header.slice(1).every(h => /(?:p|λ|lambda)\s*=/.test(h))) continue;
      for (let i = 1; i < values.length; i++) {
        const value = num(values[i].text);
        if (value === undefined) continue;
        const label = header[i].includes('frac') ? header[i].replace(/^.*?frac[^\d]*(\d+)[^\d]+(\d+).*$/, 'p = $1/$2') :
          header[i].match(/(?:p|λ|lambda)\s*=\s*[\d.]+/)?.[0] ?? header[i];
        rows.push({ model: 'CLIP-B/32 (counting loss)', setting: label, score: value });
      }
    }
    return rows;
  },
};
export default board;
