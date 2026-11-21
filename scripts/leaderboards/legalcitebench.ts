// LegalCiteBench ranks models by the normalized average across five legal citation categories. The Space reads leaderboard.json and normalizes each category to its best result.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/PhalaCloud/legal-citation-leaderboard/resolve/main/results/leaderboard.json";
const categories = ['cat1', 'cat2', 'cat3', 'cat4-1', 'cat4-2'] as const;
type Entry = Record<typeof categories[number], number> & { model: string; type: string; hallucination_rate: number };

const board: Leaderboard = {
  benchmark: "legalcitebench",
  url: "https://huggingface.co/spaces/PhalaCloud/legal-citation-leaderboard",
  feed: FEED,
  terms: "The Hugging Face Space declares the MIT License. https://huggingface.co/spaces/PhalaCloud/legal-citation-leaderboard",
  stats: { hallucinationRate: { name: 'Hallucination rate', unit: '%', better: 'lower', note: 'Percentage of generated legal citations classified as hallucinations.' } },
  parts: { cat1: 'Citation Retrieval', cat2: 'Citation Completion', cat3: 'Citation Error Detection',
    'cat4-1': 'Case Matching', 'cat4-2': 'Case Verification & Correction' },
  aliases: {"deepseek/deepseek-chat-v3.1":"deepseek-v3-1"},
  async fetch() {
    const { models } = await fetchJson<{ models: Entry[] }>(FEED);
    if (models.length < 21) throw new Error('Incomplete LegalCiteBench board');
    const maxima = categories.map(k => Math.max(...models.map(r => r[k])));
    if (!maxima.every(v => Number.isFinite(v) && v > 0)) throw new Error('Invalid category scores');
    return models.map(r => {
      const mean = categories.reduce((sum, k, i) => sum + r[k] / maxima[i], 0) / categories.length;
      return { model: r.model, score: Number(mean.toFixed(3)), open: r.type === '—' ? undefined : r.type === 'open-source',
        metrics: { ...Object.fromEntries(categories.map(k => [k, r[k]])), hallucinationRate: r.hallucination_rate } };
    });
  },
};
export default board;
