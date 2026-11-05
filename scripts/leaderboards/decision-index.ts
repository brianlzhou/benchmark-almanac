// Decision Index (text board, version 0.4.1). The makers' static Hugging Face space
// (multimodalart/jev-decision-index) renders data/index.json; its default sort is the Decision Index (Full),
// stored per model as scores.balanced_skill: 0.6 x same-skill sets + 0.4 x new-domain sets, both equated
// on 21 base models (the board's "Full" column, and the score here). Most entries are fine-tunes, LoRAs or
// inference techniques built on open base models (meta.kind), so few are models in the registry.
// Technique rows named "Technique · Base model" credit the base model, with the technique as the harness.
// The separate vision board is not read.
// Each entry's latency.median (milliseconds per request on one RTX PRO 6000; an HTTP round trip for hosted APIs)
// is kept as metrics.latency in seconds, for the board's "Median latency vs Decision Index" chart, and its
// calibration.ece (expected calibration error) as metrics.ece in points, as the calibration chart shows it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/multimodalart/jev-decision-index/resolve/main/data/index.json';

interface Entry {
  name: string;
  meta?: { kind?: string };
  scores?: { balanced_skill?: number };
  latency?: { median?: number | null };
  calibration?: { ece?: number | null } | null;
}

const board: Leaderboard = {
  benchmark: 'decision-index',
  url: 'https://huggingface.co/spaces/multimodalart/jev-decision-index',
  feed: `${FEED} (scores.balanced_skill)`,
  terms: 'JSON in the makers’ static Hugging Face space; the board’s dataset mirror (multimodalart/decision-index-leaderboard) is CC BY 4.0 and the evaluation kit MIT.',
  aliases: {},
  chart: {
    title: 'Median latency vs Decision Index',
    note: 'Median time per request on one RTX PRO 6000, on a log scale; for hosted APIs it is an HTTP round trip, so not a controlled comparison.',
    x: { key: 'latency', label: 'Median latency', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Decision Index (Full)', better: 'higher' },
  },
  async fetch() {
    const { models } = await fetchJson<{ models: Entry[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const score = m.scores?.balanced_skill;
      if (!m.name || typeof score !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof m.latency?.median === 'number' && m.latency.median > 0) metrics.latency = m.latency.median / 1000;
      if (typeof m.calibration?.ece === 'number') metrics.ece = m.calibration.ece * 100;
      const extra = Object.keys(metrics).length ? { metrics } : {};
      // "Decider chat · Gemma-4-31B": an inference technique run on a stock model, kept like a harness
      const parts = m.meta?.kind === 'inference technique' ? m.name.split(' · ') : [];
      if (parts.length === 2) rows.push({ model: parts[1].replace(/\s*\([^)]*\)$/, '').trim(), harness: parts[0].trim(), score, ...extra });
      else rows.push({ model: m.name.trim(), score, ...extra });
    }
    if (!rows.length) throw new Error('no scored models in the Decision Index');
    return rows;
  },
};
export default board;
