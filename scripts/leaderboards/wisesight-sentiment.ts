// Wisesight Sentiment is a four-class Thai social-media sentiment benchmark.
// The headline is public test accuracy from the Thai Text Classification Benchmarks README.
// The private competition accuracy is kept as a metric beside the public score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/PyThaiNLP/classification-benchmarks/master/README.md';
const board: Leaderboard = {
  benchmark: 'wisesight-sentiment',
  url: 'https://github.com/PyThaiNLP/classification-benchmarks#wisesight-sentiment',
  feed: FEED,
  terms: 'The README is published under Apache License 2.0 by PyThaiNLP. Wisesight Sentiment is public-domain data. Source attribution applies.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    const section = text.split('## [wisesight-sentiment]')[1]?.split('## [wongnai-corpus]')[0];
    if (!section) throw new Error('Wisesight Sentiment section missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      if (!line.trim().startsWith('|') || line.includes('---') || /^\|\s*Model/i.test(line)) continue;
      const cells = line.trim().split('|').slice(1).map(s => s.trim());
      if (!cells[0]) continue;
      const pub = Number(cells[1].replace(/\*/g, ''));
      const priv = Number(cells[2].replace(/\*/g, ''));
      if (!Number.isFinite(pub)) continue;
      rows.push({ model: cells[0].replace(/^\[\*\*(.+)\*\*\].*$/, '$1').replace(/^\[(.+)\]\(.+\)$/, '$1'), score: pub * 100, metrics: Number.isFinite(priv) ? { privateAccuracy: priv * 100 } : undefined });
    }
    if (rows.length < 2) throw new Error('Wisesight Sentiment score table missing');
    return rows;
  },
};
export default board;
