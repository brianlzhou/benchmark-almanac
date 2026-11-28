// Optimization-Bench (Replit): single agents and multi-agent swarms (1, 8, 16, 32) optimizing NumPy, SQLite, SQLGlot, and Git.
// Dynamically discovers the Astro SpeedupChart bundle from the Replit post and parses all 6 models x 4 swarm sizes x 4 suites.
// Live post draws four SpeedupChart SVGs ("median speedup by number of agents for six models").
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://frontier.replit.com/throwing-headcount-at-the-problem/';

interface ModelMeta {
  name: string;
  effort: string;
}

interface SuiteSeries {
  speedup: number[];
  cost: number[];
}

interface SuiteData {
  series: Record<string, SuiteSeries>;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function extractBalancedObject(src: string, startBrace: number): string {
  let depth = 0;
  let quote: string | null = null;
  let esc = false;
  for (let i = startBrace; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(startBrace, i + 1);
    }
  }
  throw new Error('Optimization-Bench: unbalanced JS object literal');
}

function jsObjToJson(src: string): unknown {
  const normalized = src
    .replace(/`([^`]*)`/g, (_, s: string) => JSON.stringify(s))
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
    .replace(/([\[,:\s])\.(\d+)/g, '$10.$2');
  return JSON.parse(normalized);
}

const board: Leaderboard = {
  benchmark: 'optimization-bench-replit',
  url: PAGE,
  feed: PAGE,
  terms: 'Public Replit Frontier engineering report and embedded Astro SpeedupChart data.',
  static: 'paper',
  costPer: 'run',
  headline: 'Geometric mean of median speedup across the four repository suites (NumPy, SQLite, SQLGlot, and Git).',
  chart: {
    title: 'Speedup vs parallel agents',
    x: { key: 'agents', label: 'Parallel agents', better: 'lower' },
    y: { key: 'score', label: 'Geometric mean speedup', unit: 'x', better: 'higher' },
    note: 'Geometric mean speedup across NumPy, SQLite, SQLGlot, and Git against swarm size (1 to 32 parallel agents).',
  },
  parts: {
    numpy: { name: 'NumPy', group: 'Repository' },
    sqlite: { name: 'SQLite', group: 'Repository' },
    sqlglot: { name: 'SQLGlot', group: 'Repository' },
    git: { name: 'Git', group: 'Repository' },
  },
  stats: {
    agents: { name: 'Parallel agents', unit: 'count' },
    numpyCost: { name: 'NumPy cost', unit: 'usd', better: 'lower' },
    sqliteCost: { name: 'SQLite cost', unit: 'usd', better: 'lower' },
    sqlglotCost: { name: 'SQLGlot cost', unit: 'usd', better: 'lower' },
    gitCost: { name: 'Git cost', unit: 'usd', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`Optimization-Bench page: ${res.status}`);
    const html = await res.text();
    const chunkMatch = html.match(/\/_astro\/SpeedupChart\.[^"'\s]+\.js/);
    if (!chunkMatch) throw new Error('Optimization-Bench: SpeedupChart bundle URL not found');

    const jsRes = await fetch(`https://frontier.replit.com${chunkMatch[0]}`, {
      headers: { 'User-Agent': 'benchmark-almanac/1.0' },
    });
    if (!jsRes.ok) throw new Error(`Optimization-Bench bundle: ${jsRes.status}`);
    const js = await jsRes.text();

    const agentsMatch = js.match(/=\s*\[(\d+(?:,\d+)*)\]\s*,\s*[a-zA-Z_$][\w$]*\s*=\s*\{opus:/);
    if (!agentsMatch) throw new Error('Optimization-Bench: agent counts array not found');
    const agentCounts = agentsMatch[1].split(',').map(Number);

    const modelsAnchor = js.indexOf('{opus:');
    const modelsObj = jsObjToJson(extractBalancedObject(js, modelsAnchor)) as Record<string, ModelMeta>;

    const suitesAnchor = js.indexOf('{numpy:');
    const suitesObj = jsObjToJson(extractBalancedObject(js, suitesAnchor)) as Record<string, SuiteData>;

    const suiteKeys = ['numpy', 'sqlite', 'sqlglot', 'git'] as const;
    const rows: LeaderboardRow[] = [];
    for (const [mKey, meta] of Object.entries(modelsObj)) {
      for (let i = 0; i < agentCounts.length; i++) {
        const nAgents = agentCounts[i];
        const speedups = suiteKeys.map((sk) => suitesObj[sk]?.series?.[mKey]?.speedup?.[i]);
        const costs = suiteKeys.map((sk) => suitesObj[sk]?.series?.[mKey]?.cost?.[i]);
        if (speedups.some((v) => typeof v !== 'number' || !Number.isFinite(v) || v <= 0)) continue;

        const geoMean = Math.pow(speedups.reduce((acc, v) => acc * v!, 1), 1 / speedups.length);
        const totalCost = costs.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);

        rows.push({
          model: meta.name,
          setting: `${meta.effort.toLowerCase()} effort, ${nAgents} ${nAgents === 1 ? 'agent' : 'agents'}`,
          score: r3(geoMean),
          cost: r2(totalCost),
          metrics: {
            numpy: r2(speedups[0]!),
            sqlite: r3(speedups[1]!),
            sqlglot: r3(speedups[2]!),
            git: r3(speedups[3]!),
            agents: nAgents,
            numpyCost: r2(costs[0]!),
            sqliteCost: r2(costs[1]!),
            sqlglotCost: r2(costs[2]!),
            gitCost: r2(costs[3]!),
          },
        });
      }
    }
    if (rows.length === 0) throw new Error('Optimization-Bench: parsed zero rows');
    return rows;
  },
};

export default board;
