// Maze Bench ranks runs by the percentage of gems collected, with separate tool and budget settings.
// The official manifest links run shards. The 200M-token and $2000 views use the last eligible checkpoint.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://mazebench.com/leaderboard/ai';
const feed = 'https://mazebench.com/data/ai-leaderboards.json';
type BudgetField = 'total_tokens' | 'cost_usd';
interface Stats {
  gems: number; rooms: number; moves: number; action?: number; actions?: number; cost_usd?: number;
  total_tokens: number; output_tokens?: number; input_tokens?: number; cached_input_tokens?: number; input_tokens_uncached?: number; responses?: number;
}
interface Entry extends Stats {
  model: string; gem_total: number; room_total?: number; unique_tiles?: number; id: string; harness: string; reasoning: string; created_at: string;
  source_url?: string; time_spent_ms?: number; response_count?: number;
  series?: { performance?: Stats[]; performance_estimated?: boolean; verified_score_checkpoints?: Partial<Record<BudgetField, number>> };
}
interface Board { title: string; entries: Entry[] }
function checkpoint(e: Entry, field: BudgetField, limit: number) {
  const total = e[field];
  if (typeof total !== 'number' || total < (field === 'total_tokens' ? 150_000_000 : 0)) return;
  if (total <= limit) return e;
  const s = e.series;
  if (!s?.performance || (s.performance_estimated && s.verified_score_checkpoints?.[field] !== limit)) return;
  const above = s.performance.findIndex(p => Number(p[field]) > limit);
  const p = s.performance[above - 1];
  if (p && [p[field], p.gems, p.rooms, p.action, p.moves].every(v => typeof v === 'number' && v >= 0)) return p;
}
const board: Leaderboard = {
  benchmark: 'maze-bench', url, feed, costPer: 'run',
  terms: 'Public Maze Bench leaderboard manifest and score checkpoints published by the authors.',
  stats: {
    gemsAvailable: { name: 'Gems available', unit: 'count' },
    rooms: { name: 'Rooms', unit: 'count', better: 'higher' },
    roomsAvailable: { name: 'Rooms available', unit: 'count' },
    uniqueTiles: { name: 'Unique tiles visited', unit: 'count', better: 'higher' },
    moves: { name: 'Moves', unit: 'count' },
    actions: { name: 'Actions', unit: 'count' },
    responses: { name: 'Model responses', unit: 'count' },
    totalTokens: { name: 'Total tokens', unit: 'tokens' },
    inputTokens: { name: 'Input tokens', unit: 'tokens' },
    cachedInputTokens: { name: 'Cached input tokens', unit: 'tokens' },
    uncachedInputTokens: { name: 'Uncached input tokens', unit: 'tokens' },
    latency: { name: 'Run latency', unit: 'seconds', better: 'lower' },
  },
  aliases: { 'muse-wonder-full-1.0': 'muse-wonder-full', 'nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B': 'nemotron-3-ultra' },
  async fetch() {
    const manifest = await fetchJson<{ parts: string[]; leaderboards: Board[] }>(feed);
    const rows: LeaderboardRow[] = [];
    let count = 0;
    const add = (b: Board, e: Entry) => {
      if (!b || !e.model || !e.id || !Number.isFinite(e.gems)) throw new Error('Missing Maze Bench score');
      count++;
      const budgets = [['200M tokens', checkpoint(e, 'total_tokens', 200_000_000)], ['$2000', checkpoint(e, 'cost_usd', 2000)], ['All', e]] as const;
      for (const [budget, p] of budgets) {
        if (!p) continue;
        const metrics: Record<string, number> = { gemsAvailable: e.gem_total, rooms: p.rooms, moves: p.moves, totalTokens: p.total_tokens };
        const act = p === e ? (e.actions ?? e.action) : p.action;
        if (typeof act === 'number' && Number.isFinite(act)) metrics.actions = act;
        const resp = p === e ? (e.response_count ?? e.responses) : p.responses;
        if (typeof resp === 'number' && Number.isFinite(resp)) metrics.responses = resp;
        if (typeof p.input_tokens_uncached === 'number' && Number.isFinite(p.input_tokens_uncached)) metrics.uncachedInputTokens = p.input_tokens_uncached;
        if (p === e) {
          if (typeof e.room_total === 'number' && Number.isFinite(e.room_total)) metrics.roomsAvailable = e.room_total;
          if (typeof e.unique_tiles === 'number' && Number.isFinite(e.unique_tiles)) metrics.uniqueTiles = e.unique_tiles;
          if (typeof e.input_tokens === 'number' && Number.isFinite(e.input_tokens)) metrics.inputTokens = e.input_tokens;
          if (typeof e.cached_input_tokens === 'number' && Number.isFinite(e.cached_input_tokens)) metrics.cachedInputTokens = e.cached_input_tokens;
          if (Number.isFinite(e.time_spent_ms)) metrics.latency = e.time_spent_ms! / 1000;
        }
        rows.push({ model: e.model, score: p.gems, setting: [b.title, budget, e.reasoning, e.id].filter(Boolean).join(' · '),
          harness: e.model === 'claude-sonnet-5-5' ? 'Claude Code' : e.harness, date: e.created_at.slice(0, 10),
          cost: p.cost_usd ?? undefined, tokens: p.output_tokens ?? undefined, metrics,
          link: e.source_url || url + '?run=' + encodeURIComponent(e.id),
        });
      }
    };
    for (const b of manifest.leaderboards) for (const e of b.entries) add(b, e);
    for (const part of manifest.parts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const shard = await fetchJson<{ entries: { board: number; entry: Entry }[] }>(new URL(part, feed).href);
      for (const r of shard.entries) add(manifest.leaderboards[r.board], r.entry);
    }
    if (count < 77 || rows.length < 192) throw new Error('Incomplete Maze Bench runs or budget views');
    return rows;
  },
};
export default board;
