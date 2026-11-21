// Sumi Japanese PII Corpus evaluates exact-span PII detection on synthetic Japanese documents.
// The headline score is the template-independent generalisation micro F1 reported by the authors.
// This importer reads the repository README's generalisation table and keeps entity F1 values as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/NagaYu/sumi/main/README.md';
const entityKeys = ['name', 'address', 'phone', 'birthDate', 'email', 'bankAccount', 'myNumber', 'memberId'];

const board: Leaderboard = {
  benchmark: 'sumi-ja-pii-corpus',
  url: 'https://github.com/NagaYu/sumi',
  feed,
  terms: 'The Sumi repository is published under Apache License 2.0. https://github.com/NagaYu/sumi/blob/main/LICENSE',
  async fetch() {
    const source = await fetchText(feed);
    const section = source.split('## Evaluation — generalisation')[1]?.split('### Recall at a fixed false-positive budget')[0];
    if (!section) throw new Error('Missing Sumi generalisation section');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      if (!line.trim().startsWith('|') || line.includes('---') || /Condition\s*\|/i.test(line)) continue;
      const cells = line.trim().split('|').slice(1).map(cell => cell.trim());
      if (cells.length < 10) continue;
      const score = Number(cells[9]);
      if (!cells[0] || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      entityKeys.forEach((key, index) => { const value = Number(cells[index + 1]); if (Number.isFinite(value)) metrics[key] = value; });
      rows.push({ model: cells[0], score, setting: 'Template-independent generalisation set, 100 positive and 100 negative documents', metrics });
    }
    if (rows.length !== 5) throw new Error(`Expected five Sumi generalisation rows, got ${rows.length}`);
    return rows;
  },
};

export default board;
