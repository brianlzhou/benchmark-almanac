// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The leaderboard script gives memory-assisted answer accuracy and query latency on the Small and Medium tiers.
// Table 2 identifies Qwen3.5-9B as the fixed reader and GPT-5.4-mini as the controller for the coding agents.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://xiaowu0162.github.io/longmemeval-v2/';
const feed = url + 'static/js/index.js';
const tiers = ['small', 'medium'];
const measures = ['Accuracy', 'Static', 'Dynamic', 'Procedure', 'Gotchas', 'Latency'];
const parts: Record<string, BoardPart> = {};
for (const tier of tiers) {
  for (const name of measures.filter(m => m !== 'Latency')) {
    parts[tier + name] = { name, group: tier === 'small' ? 'LME-V2-Small' : 'LME-V2-Medium' };
  }
}
const board: Leaderboard = {
  benchmark: 'longmemeval-v2', feed, url, parts, harnesses: 'system',
  terms: 'The authors publish the leaderboard on GitHub Pages under https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  headline: 'The leaderboard reports accuracy for each tier separately, so this is the plain mean of Small and Medium accuracy.',
  stats:{smallLatency:{name:'Small query latency',unit:'seconds',better:'lower'},mediumLatency:{name:'Medium query latency',unit:'seconds',better:'lower'}},
  async fetch() {
    const script = await fetchText(feed);
    const list = script.match(/const leaderboardEntries\s*=\s*\[([\s\S]*?)\n\];/)?.[1];
    if (!list) throw new Error('Missing leaderboard entries');
    const rows: LeaderboardRow[] = [];
    for (const [block] of list.matchAll(/\{[^{}]*\}/g)) {
      if (/tiers:\s*\["small"\]/.test(block)) continue;
      const system = block.match(/system:\s*"([^"]+)"/)?.[1];
      if (!system) throw new Error('Missing memory system');
      const coding = ['Codex', 'AgentRunbook-C'].includes(system);
      if (!coding && !['No retrieval', 'RAG: query to slice', 'RAG: query to slice + notes', 'AgentRunbook-R'].includes(system)) {
        throw new Error('Review the controller and reader for ' + system);
      }
      const metrics: Record<string, number> = {};
      for (const tier of tiers) {
        for (const measure of measures) {
          const key = tier + measure;
          const value = block.match(new RegExp(key + 'Value:\\s*([\\d.]+)\\s*,'))?.[1];
          if (!value || !Number.isFinite(Number(value))) throw new Error('Missing ' + key + ' for ' + system);
          metrics[key] = Number(value);
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
