// Arabic TTS Arena (Navid AI): blind human-preference Elo arena for Arabic text-to-speech models
// across 5 dialects (MSA, Gulf, Egyptian, Levantine, Maghrebi). Reads the live leaderboard.json
// from the Hugging Face Space, keeping Elo, 95% confidence interval (+/- ci -> low/high), dialect
// Elo sub-ratings, win rate, average latency (seconds), battles, wins, losses, ties, open_weight,
// and model links (including retired archived models preserved on the leaderboard).
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://huggingface.co/spaces/Navid-AI/Arabic-TTS-Arena/raw/main/leaderboard.json';

interface ArabicTtsModel {
  name: string;
  model_url?: string;
  elo: number;
  ci?: number;
  wins?: number;
  losses?: number;
  ties?: number;
  battles?: number;
  win_rate?: number;
  avg_latency?: number;
  open_weight?: boolean;
  retired?: boolean;
  dialects?: Record<string, { elo?: number; battles?: number }>;
}

interface ArabicTtsFeed {
  models: ArabicTtsModel[];
}

const DIALECTS = ['msa', 'gulf', 'egyptian', 'levantine', 'maghrebi'] as const;

const board: Leaderboard = {
  benchmark: 'arabic-tts-arena',
  url: 'https://huggingface.co/spaces/Navid-AI/Arabic-TTS-Arena',
  feed: FEED,
  terms: 'Public Hugging Face Space leaderboard published by Navid AI.',
  parts: {
    msa: { name: 'Modern Standard Arabic', unit: 'elo', better: 'higher' },
    gulf: { name: 'Gulf', unit: 'elo', better: 'higher' },
    egyptian: { name: 'Egyptian', unit: 'elo', better: 'higher' },
    levantine: { name: 'Levantine', unit: 'elo', better: 'higher' },
    maghrebi: { name: 'Maghrebi', unit: 'elo', better: 'higher' },
  },
  stats: {
    winRate: { name: 'Win rate', unit: '%', better: 'higher' },
    latency: { name: 'Average latency', unit: 'seconds', better: 'lower', note: 'Average speech synthesis latency per prompt.' },
    battles: { name: 'Battles', unit: 'count', note: 'Total head-to-head human listening comparisons.' },
    wins: { name: 'Wins', unit: 'count', better: 'higher' },
    losses: { name: 'Losses', unit: 'count', better: 'lower' },
    ties: { name: 'Ties', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = JSON.parse(await fetchText(FEED)) as ArabicTtsFeed;
    const rows: LeaderboardRow[] = [];
    for (const m of data.models ?? []) {
      if (!m.name || !Number.isFinite(m.elo)) continue;
      const metrics: Record<string, number> = {};
      for (const d of DIALECTS) {
        const v = m.dialects?.[d]?.elo;
        if (typeof v === 'number' && Number.isFinite(v)) metrics[d] = v;
      }
      if (typeof m.win_rate === 'number' && Number.isFinite(m.win_rate)) metrics.winRate = m.win_rate;
      if (typeof m.avg_latency === 'number' && Number.isFinite(m.avg_latency) && m.avg_latency > 0) metrics.latency = m.avg_latency;
      if (typeof m.battles === 'number' && Number.isFinite(m.battles)) metrics.battles = m.battles;
      if (typeof m.wins === 'number' && Number.isFinite(m.wins)) metrics.wins = m.wins;
      if (typeof m.losses === 'number' && Number.isFinite(m.losses)) metrics.losses = m.losses;
      if (typeof m.ties === 'number' && Number.isFinite(m.ties)) metrics.ties = m.ties;

      const hasCi = typeof m.ci === 'number' && Number.isFinite(m.ci) && m.ci > 0;
      const link = m.model_url?.trim().replace(/&amp;/g, '&');

      rows.push({
        model: m.name.trim(),
        score: m.elo,
        ...(hasCi ? { low: +(m.elo - m.ci!).toFixed(1), high: +(m.elo + m.ci!).toFixed(1) } : {}),
        ...(typeof m.open_weight === 'boolean' ? { open: m.open_weight } : {}),
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
