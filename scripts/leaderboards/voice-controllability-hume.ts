// Hume's Voice Controllability Leaderboard measures whether voice systems follow requested voice attributes.
// This importer reads the public Gradio configuration, whose Voice Design Overall panel embeds percentage accuracy
// and five category scores. The headline is the panel's Overall accuracy, where higher is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/spaces/HumeAI/voice-controllability-leaderboard';
const CONFIG = 'https://humeai-voice-controllability-leaderboard.hf.space/config';
const PARTS = {
  accent: { name: 'Accent', unit: '%' },
  age: { name: 'Age', unit: '%' },
  gender: { name: 'Gender', unit: '%' },
  texture: { name: 'Texture', unit: '%' },
  prosody: { name: 'Prosody', unit: '%' },
};
const board: Leaderboard = {
  benchmark: 'voice-controllability-hume',
  url: PAGE,
  feed: `${CONFIG} (Voice Design Overall panel)`,
  terms: 'The Space is Apache-2.0. Its backing dataset is private, while this public configuration publishes the leaderboard table. https://huggingface.co/spaces/HumeAI/voice-controllability-leaderboard',
  parts: PARTS,
  async fetch() {
    const config = JSON.parse(await fetchText(CONFIG)) as { components?: { id?: number; props?: { value?: unknown } }[] };
    const value = config.components?.find((c) => c.id === 10)?.props?.value;
    if (typeof value !== 'string') throw new Error('Voice Controllability: Voice Design panel missing from public config');
    const panel = value.match(/<div class='sec-panel' data-sp='0'[\s\S]*?<\/table>/)?.[0];
    if (!panel) throw new Error('Voice Controllability: Voice Design Overall table missing');
    const rows: LeaderboardRow[] = [];
    for (const match of panel.matchAll(/<tr[^>]*>\s*<td class='rank'>\s*\d+\s*<\/td>\s*<td class='prov'>\s*([^<]+?)\s*<\/td>([\s\S]*?)<\/tr>/g)) {
      const model = match[1].trim();
      const cells = [...match[2].matchAll(/<td[^>]*data-v='([^']+)'[^>]*>/g)].map((m) => Number(m[1]));
      if (cells.length !== 6 || cells.some((n) => !Number.isFinite(n))) throw new Error(`Voice Controllability: invalid row for ${model}`);
      rows.push({ model, score: cells[0], harness: 'Voice Design', metrics: { accent: cells[1], age: cells[2], gender: cells[3], texture: cells[4], prosody: cells[5] } });
    }
    if (rows.length < 5) throw new Error(`Voice Controllability: ${rows.length} rows, expected at least 5`);
    return rows;
  },
};
export default board;
