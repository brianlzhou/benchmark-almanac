// Moonworks Lunara Art Eval compares eight text-to-image models across 1,000 art prompts (8,000 images).
// The Hugging Face dataset card publishes the paper's model-comparison table sorted by Aesthetic Quality.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://huggingface.co/datasets/moonworks/lunara-art-eval/raw/main/README.md';

const board: Leaderboard = {
  benchmark: 'moonworks-lunara-art-eval',
  static: 'paper',
  url: 'https://huggingface.co/datasets/moonworks/lunara-art-eval',
  feed,
  terms: 'Dataset card in moonworks/lunara-art-eval on Hugging Face, licensed Apache 2.0, reporting Table results from arXiv:2609.22272.',
  aliases: {
    'GPT 1 Image Mini': 'gpt-image-1-mini',
    'Qwen Image': 'qwen-image',
    'FLUX-Klein-4B': 'flux-2-klein-4b',
  },
  stats: {
    aestheticWinRate: { name: 'Aesthetic win rate', unit: '%', better: 'higher' },
    emotionalResonance: { name: 'Emotional Resonance', unit: 'score', better: 'higher', note: 'Judge score for affective impression and expressive impact.' },
    emotionalWinRate: { name: 'Emotional win rate', unit: '%', better: 'higher' },
    contentIntegrity: { name: 'Content Integrity', unit: 'score', better: 'higher', note: 'Judge score for structural coherence and requested subject completeness.' },
    contentWinRate: { name: 'Content win rate', unit: '%', better: 'higher' },
    clipScore: { name: 'CLIPScore', unit: 'score', better: 'higher' },
    laionAesthetic: { name: 'LAION Aesthetic', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const md = await fetchText(feed);
    const lines = md.split(/\r?\n/);
    const start = lines.findIndex((l) => /\|\s*Model\s*\|\s*Aesthetic Quality/i.test(l));
    if (start < 0) throw new Error('Missing Moonworks Lunara Art Eval table in README');
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(start + 2)) {
      if (!line.trim().startsWith('|')) break;
      const cells = line.split('|').slice(1, -1).map((c) => c.replace(/\*\*/g, '').replace(/%/g, '').trim());
      if (cells.length < 9) continue;
      const [model, aesS, aesWinS, emoS, emoWinS, conS, conWinS, clipS, laionS] = cells;
      const score = Number(aesS);
      if (!model || !Number.isFinite(score)) continue;
      rows.push({
        model,
        score,
        metrics: {
          aestheticWinRate: Number(aesWinS),
          emotionalResonance: Number(emoS),
          emotionalWinRate: Number(emoWinS),
          contentIntegrity: Number(conS),
          contentWinRate: Number(conWinS),
          clipScore: Number(clipS),
          laionAesthetic: Number(laionS),
        },
      });
    }
    if (rows.length < 8) throw new Error(`Expected 8 Lunara Art Eval rows, got ${rows.length}`);
    return rows;
  },
};

export default board;
