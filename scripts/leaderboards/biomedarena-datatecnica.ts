// BiomedArena (Arena and DataTecnica) ranks LLMs and biomedical tool systems on pairwise biomedical queries.
// This importer reads the public BiomedArena.AI leaderboard and model-configuration APIs, preserving Elo ratings,
// confidence intervals, match counts, win/loss/tie/both-bad breakdowns, win rates and reasoning effort settings.
// Entries written as "<model> + <system>" are split into model and harness so tool-augmented systems are tracked
// separately from plain models. Undated multi-snapshot models are kept explicit so they never bind to the wrong release.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://api.biomedarena.ai/api/v1/leaderboard/?limit=100';
const LLMS_FEED = 'https://api.biomedarena.ai/api/v1/llms/';

interface Entry {
  llm_id?: string;
  llm_name?: string;
  elo_rating?: number;
  matches_played?: number;
  wins?: number;
  losses?: number;
  ties?: number;
  both_bad?: number;
  win_rate?: number;
  confidence_interval?: number;
}

interface LlmMeta {
  id?: string;
  llm_name?: string;
  extra_params?: {
    provider_model_name?: string;
    reasoning_effort?: string;
  };
}

const UNDATED_MULTI_SNAPSHOT = /^(?:gpt-4o|gemini-2\.5-flash|gemini-2\.5-pro)$/i;

const board: Leaderboard = {
  benchmark: 'biomedarena-datatecnica',
  url: 'https://biomedarena.ai/leaderboard',
  feed: FEED,
  terms: 'Public unauthenticated leaderboard API of BiomedArena.AI (DataTecnica and Arena), credited and linked by Benchmark Almanac.',
  harnesses: 'system',
  aliases: {
    'claude-4-0-sonnet': 'claude-sonnet-4',
  },
  stats: {
    matches: { name: 'Matches played', unit: 'count' },
    wins: { name: 'Wins', unit: 'count', better: 'higher' },
    losses: { name: 'Losses', unit: 'count', better: 'lower' },
    ties: { name: 'Ties', unit: 'count' },
    bothBad: { name: 'Both bad votes', unit: 'count', better: 'lower' },
    winRate: { name: 'Win rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    const data = await fetchJson<{ entries?: Entry[] }>(FEED);
    await new Promise((r) => setTimeout(r, 500));
    const llms = await fetchJson<LlmMeta[]>(LLMS_FEED);
    const metaById = new Map(llms.filter((l) => l.id).map((l) => [l.id!, l]));
    const entries = data.entries ?? [];
    if (entries.length < 15) throw new Error(`Expected at least 15 BiomedArena entries, got ${entries.length}`);
    const rows: LeaderboardRow[] = [];
    for (const e of entries) {
      const raw = e.llm_name?.trim();
      if (!raw || typeof e.elo_rating !== 'number' || !Number.isFinite(e.elo_rating)) continue;
      const plus = raw.match(/^(.+?)\s+\+\s+(.+)$/);
      const baseModel = plus ? plus[1].trim() : raw;
      const harness = plus ? plus[2].trim() : undefined;
      const meta = e.llm_id ? metaById.get(e.llm_id) : undefined;
      const effort = meta?.extra_params?.reasoning_effort?.trim();
      const setting = effort ? `${effort} reasoning` : undefined;
      const model = UNDATED_MULTI_SNAPSHOT.test(baseModel) ? `${baseModel} (snapshot unspecified)` : baseModel;
      const score = e.elo_rating;
      const ci = typeof e.confidence_interval === 'number' && Number.isFinite(e.confidence_interval) && e.confidence_interval > 0 ? e.confidence_interval : undefined;
      const low = ci !== undefined ? Number((score - ci).toFixed(2)) : undefined;
      const high = ci !== undefined ? Number((score + ci).toFixed(2)) : undefined;
      const metrics: Record<string, number> = {};
      if (low !== undefined && high !== undefined) Object.assign(metrics, { ciLow: low, ciHigh: high });
      if (typeof e.matches_played === 'number') metrics.matches = e.matches_played;
      if (typeof e.wins === 'number') metrics.wins = e.wins;
      if (typeof e.losses === 'number') metrics.losses = e.losses;
      if (typeof e.ties === 'number') metrics.ties = e.ties;
      if (typeof e.both_bad === 'number') metrics.bothBad = e.both_bad;
      if (typeof e.win_rate === 'number' && Number.isFinite(e.win_rate)) metrics.winRate = Number((e.win_rate * 100).toFixed(2));
      rows.push({
        model,
        harness,
        setting,
        score,
        low,
        high,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (rows.length < 15) throw new Error(`Parsed only ${rows.length} BiomedArena rows`);
    return rows;
  },
};
export default board;
