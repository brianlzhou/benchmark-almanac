// NanoGPT Speedrun Frontier records autonomous agents that optimize a fixed
// GPT training run. Prime Intellect publishes each run in a JavaScript bundle,
// where lower validation loss is better and run metadata includes cost and tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.primeintellect.ai/research/nanogpt-speedrun';
const FEED = 'https://www.primeintellect.ai/_next/static/chunks/5603-1d6345060838223f.js?dpl=dpl_F2kJTypVLVWR1hUMegKoLwxv1VLq';
interface Run { name?: string; label?: string; record?: number; cost?: number; totalTokens?: number; tokens?: number; calls?: number; harness?: string; effort?: string; seed?: string; contract?: string }
const board: Leaderboard = {
  benchmark: 'nanogpt-speedrun-frontier-prime-intellect', url: PAGE, feed: FEED,
  terms: 'Prime Intellect publishes these experiment results in the public research page bundle. Separate score reuse terms are not stated.',
  async fetch() {
    const source = await fetchText(FEED);
    const match = source.match(/JSON\.parse\('(\{[\s\S]*?\})'\)/);
    if (!match) throw new Error('NanoGPT Speedrun Frontier: embedded result JSON is missing');
    const payload = Function(`return '${match[1]}'`)() as string;
    const data = JSON.parse(payload) as { runs?: Run[] };
    const rows: LeaderboardRow[] = (data.runs ?? []).flatMap((run) => {
      if (!run.name || typeof run.record !== 'number') return [];
      return [{ model: run.name, setting: [run.effort, run.seed, run.contract].filter(Boolean).join(', ') || undefined, harness: run.harness, score: run.record, cost: run.cost, tokens: run.tokens ?? run.totalTokens, ...(typeof run.calls === 'number' ? { metrics: { calls: run.calls } } : {}) }];
    });
    if (rows.length < 50) throw new Error(`NanoGPT Speedrun Frontier: ${rows.length} runs, expected at least 50`);
    return rows;
  },
};
export default board;
