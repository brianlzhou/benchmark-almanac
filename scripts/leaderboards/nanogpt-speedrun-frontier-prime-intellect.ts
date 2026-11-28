// NanoGPT Speedrun Frontier records autonomous agents that optimize a fixed
// GPT training run. Prime Intellect publishes each run in a JavaScript bundle,
// where lower validation loss is better and run metadata includes cost and tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.primeintellect.ai/research/nanogpt-speedrun';
const ORIGIN = 'https://www.primeintellect.ai';
interface Run { name?: string; label?: string; record?: number; cost?: number; totalTokens?: number; tokens?: number; calls?: number; harness?: string; effort?: string; seed?: string; contract?: string }
const board: Leaderboard = {
  benchmark: 'nanogpt-speedrun-frontier-prime-intellect', harnesses: 'system', url: PAGE, feed: `${PAGE} (Next.js chunk with embedded runs JSON)`,
  terms: 'Prime Intellect publishes these experiment results in the public research page bundle. Separate score reuse terms are not stated.',
  stats: { calls: { name: 'Optimization calls', unit: 'count' } },
  async fetch() {
    const html = await fetchText(PAGE);
    const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"'\s<>]+\.js(?:\?[^"'\s<>]*)?/g)].map((m) => m[0]))];
    let payload: string | undefined;
    for (const chunk of chunks) {
      const source = await fetchText(ORIGIN + chunk);
      const match = source.match(/JSON\.parse\('(\{"baseline":[\s\S]*?"runs":\[[\s\S]*?\})'\)/);
      if (match) {
        payload = match[1].replace(/\\x([0-9a-fA-F]{2})/g, '\\u00$1').replace(/\\'/g, "'");
        break;
      }
    }
    if (!payload) throw new Error('NanoGPT Speedrun Frontier: embedded result JSON is missing');
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
