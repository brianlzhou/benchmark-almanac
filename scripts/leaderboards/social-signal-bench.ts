// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The dataset card ranks audio and video separately by evidence-weighted F1 for social signals.
// Only models evaluated in both modalities have a headline score.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://huggingface.co/datasets/Interhuman/social-signal-bench';
const keys = ['EvidenceWeighted', 'Micro', 'Macro', 'Engagement'];
const labels = ['evidence-weighted F1', 'micro-F1', 'macro-F1', 'engagement macro-F1'];
export default {
  benchmark: 'social-signal-bench', url, feed: url,
  terms: 'The dataset card specifies CC BY-NC 4.0. ' + url,
  headline: 'The headline is the plain mean of audio and video evidence-weighted F1 for models on both leaderboards.',
  parts: Object.fromEntries(['audio', 'video'].flatMap(track => keys.map((key, i) => ({
    key: track + key, name: (track === 'audio' ? 'Audio ' : 'Video ') + labels[i], unit: 'score' as const,
  })).map(({ key, ...part }) => [key, part]))),
  async fetch() {
    const grids = tables(await fetchText(url)).map(t => t.map(row => row.map(c => c.text)));
    const read = (track: 'audio' | 'video') => {
      const video = track === 'video';
      const t = grids.find(g => g[0].includes('EW-F1') && g[0].includes('Input') === video);
      if (!t || t[0].slice(-4).join('|') !== 'EW-F1|Micro-F1|Macro-F1|Engagement macro-F1')
        throw new Error('Missing ' + track + ' leaderboard');
      const models = new Map<string, Record<string, number>>();
      for (const c of t.slice(1)) {
        const model = c[1].replace(/^⭐\s*/, '');
        const values = c.slice(-4);
        if (models.has(model) || values.some(s => !/^\d+(\.\d+)?$/.test(s))) throw new Error('Invalid ' + track + ' row');
        models.set(model, Object.fromEntries(keys.map((key, i) => [track + key, Number(values[i])])));
      }
      return models;
    };
    const video = read('video');
    const audio = read('audio');
    const rows = [...video].flatMap(([model, v]) => {
      const a = audio.get(model);
      return a ? [{ model, score: (a.audioEvidenceWeighted + v.videoEvidenceWeighted) / 2,
        metrics: { ...a, ...v } }] : [];
    });
    return checked(rows, 2);
  },
} satisfies Leaderboard;
