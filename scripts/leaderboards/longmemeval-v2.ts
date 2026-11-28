// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The leaderboard script gives memory-assisted answer accuracy and query latency on the Small and Medium tiers.
// Table 2 identifies Qwen3.5-9B as the fixed reader and GPT-5.4-mini as the controller for the coding agents.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://xiaowu0162.github.io/longmemeval-v2/';
const feed = url + 'static/data/leaderboard.json';
const tiers = ['small', 'medium'] as const;
const measures = ['Accuracy', 'Static', 'Dynamic', 'Procedure', 'Gotchas', 'Latency'] as const;
const parts: Record<string, BoardPart> = {};
for (const tier of tiers) {
  for (const name of measures.filter(m => m !== 'Latency')) {
    parts[tier + name] = { name, group: tier === 'small' ? 'LME-V2-Small' : 'LME-V2-Medium' };
  }
}
interface OperatingPoint { accuracy: number; static: number; dynamic: number; procedure: number; gotchas: number; latency: number }
interface SystemEntry { name: string; results: Partial<Record<'small' | 'medium', { operatingPoints: OperatingPoint[] }>> }
const board: Leaderboard = {
  benchmark: 'longmemeval-v2', feed, url, parts, harnesses: 'system',
  terms: 'The authors publish the leaderboard on GitHub Pages under https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  headline: 'The leaderboard reports accuracy for each tier separately, so this is the plain mean of Small and Medium accuracy.',
  stats:{smallLatency:{name:'Small query latency',unit:'seconds',better:'lower'},mediumLatency:{name:'Medium query latency',unit:'seconds',better:'lower'}},
  chart: {
    title: 'Accuracy vs. memory-query latency',
    x: { key: 'smallLatency', label: 'Small query latency', unit: 's', better: 'lower', log: true },
    y: { key: 'smallAccuracy', label: 'Small accuracy', unit: '%', better: 'higher' },
    note: 'LongMemEval-V2 plots answer accuracy against memory-query latency on a log scale with a reference frontier.',
  },
  async fetch() {
    const data = await fetchJson<{ systems: SystemEntry[] }>(feed);
    if (!Array.isArray(data.systems) || !data.systems.length) throw new Error('Missing leaderboard entries');
    const rows: LeaderboardRow[] = [];
    for (const entry of data.systems) {
      const small = entry.results?.small?.operatingPoints?.[0];
      const medium = entry.results?.medium?.operatingPoints?.[0];
      if (!small || !medium) continue;
      const system = entry.name;
      const coding = ['Codex', 'AgentRunbook-C'].includes(system);
      if (!coding && !['No retrieval', 'RAG: query to slice', 'RAG: query to slice + notes', 'AgentRunbook-R'].includes(system)) {
        throw new Error('Review the controller and reader for ' + system);
      }
      const metrics: Record<string, number> = {};
      for (const [tier, pt] of [['small', small], ['medium', medium]] as const) {
        for (const measure of measures) {
          const val = pt[measure.toLowerCase() as keyof OperatingPoint];
          if (!Number.isFinite(val)) throw new Error('Missing ' + tier + measure + ' for ' + system);
          metrics[tier + measure] = val;
        }
      }
      rows.push({
        model: coding ? 'GPT-5.4-mini' : 'Qwen3.5-9B',
        ...(coding ? { models: ['GPT-5.4-mini', 'Qwen3.5-9B'], setting: 'xhigh reasoning' } : {}),
        ...(system === 'No retrieval' ? { setting: system } : { harness: system }),
        score: (metrics.smallAccuracy + metrics.mediumAccuracy) / 2, metrics,
      });
    }
    return checked(rows, 6);
  },
};
export default board;
