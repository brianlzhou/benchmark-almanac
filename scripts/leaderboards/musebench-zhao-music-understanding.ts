// The source reports no overall score. The headline is the plain mean of the 3 modality parts, computed by this importer.
// MuseBench evaluates music-score and performance understanding from text, image, and audio questions. Table 1 reports accuracy by modality.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2601.11968';
export default {
  benchmark: 'musebench-zhao-music-understanding', static: 'paper', url: feed, feed,
  terms: 'Paper and license at https://arxiv.org/abs/2601.11968',
  headline: 'The paper reports no overall score, so this is the plain mean of text, audio, and image accuracy.',
  parts: { text: 'Text', audio: 'Audio', image: 'Image' },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Modality|Model|Accuracy (%)');
    if (!table) throw new Error('Missing MuseBench Table 1');
    const groups = new Map<string, Record<string, number>>();
    let currentModality = '';
    for (const [modality, label, value] of table.slice(1)) {
      if (modality) currentModality = modality;
      if (!label || label === 'Random' || !/^\d+(?:\.\d+)?$/.test(value)) continue;
      const model = label.replace(/\s+[a-z][\w.]+$/, '');
      const row = groups.get(model) ?? {};
      row[currentModality.toLowerCase()] = Number(value);
      groups.set(model, row);
    }
    const out = [...groups.entries()].flatMap(([model, metrics]) => {
      if (!['text', 'audio', 'image'].every(k => Number.isFinite(metrics[k]))) return [];
      return [{ model, score: (metrics.text + metrics.audio + metrics.image) / 3, metrics }];
    });
    return checked(out, 3);
  },
} satisfies Leaderboard;
