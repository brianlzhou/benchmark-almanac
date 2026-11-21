// ImageJevBench v0.3.0 ranks systems by the core composite. Read the versioned API for scores and measurement dates.
// Join its rows to the page's matching core results for prices, latencies and accuracy by split.
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

const url = "https://benchmarkheaven.com/image-jev-bench";
const feed = "https://benchmarkheaven.com/api/decision-results/imagejevbench/v0.3.0/json";
type Entry = { key: string, name: string, ranked: boolean, composite: number, capability: number, intelligence: number,
  calibration: number, speed: number, cost_axis: number, last_measured_on?: string, source_url?: string };
type System = { key: string, jevbench_score: number, open: string, licence: string, cost: {usd_per_1000: number | null},
  speed: {p50_s_adjusted: number, p95_s_adjusted: number}, public_accuracy: number, sealed_accuracy: number };
const board: Leaderboard = {
  benchmark: 'imagejevbench-0-3-0', url, feed,
  terms: "Benchmark Heaven, ImageJevBench v0.3.0, CC BY 4.0. Accessed 2026-11-20. The site allows these paths in robots.txt. Source SHA-256: 373ac5b62a7bc353e9de1a252e94df3a1545bc36e85f3ae23b58105b75dfde11.",
  aliases: { 'GPT-6 Luna via OpenAI Decisions (OpenAI)': 'gpt-6-luna', 'GPT-6 Luna (low reasoning effort)': 'gpt-6-luna' },
  parts: { publicAccuracy: {name: 'Public accuracy', unit: '%'}, sealedAccuracy: {name: 'Sealed accuracy', unit: '%'} },
  stats: {
    capability: { name: 'Capability', unit: 'score', better: 'higher' },
    intelligence: { name: 'Intelligence', unit: 'score', better: 'higher' },
    calibration: { name: 'Calibration', unit: 'score', better: 'higher' },
    speed: { name: 'Speed', unit: 'score', better: 'higher' },
    costAxis: { name: 'Cost axis', unit: 'score', better: 'lower' },
    p50Latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    p95Latency: { name: '95th percentile latency', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const release = await fetchJson<{version: string, rows: Entry[]}>(feed);
    const ranked = release.rows.filter(r => r.ranked);
    if (release.version !== 'v0.3.0' || ranked.length < 65) throw new Error('Incomplete v0.3.0 core results');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const systems = jsonAfter<System[]>(nextFlight(await fetchText(url)), '"systems":');
    const byKey = new Map(systems.map(s => [s.key, s]));
    return ranked.map(r => {
      const s = byKey.get(r.key);
      if (!r.name || !Number.isFinite(r.composite) || s?.jevbench_score !== r.composite) throw new Error('Core result mismatch: ' + r.key);
      const price = s.cost.usd_per_1000;
      const setting = r.name.match(/reasoning (auto|off)/)?.[1] ?? (r.name.includes('low reasoning effort') ? 'low' : undefined);
      return { model: r.name, score: r.composite, date: r.last_measured_on?.slice(0,10), link: r.source_url || undefined,
        setting, harness: r.name.includes('via OpenAI Decisions') ? 'OpenAI Decisions' : undefined,
        open: ['yes','no'].includes(s.open) ? s.open === 'yes' : undefined, license: s.licence || undefined,
        cost: typeof price === 'number' ? price / 1000 : undefined,
        metrics: { capability: r.capability, intelligence: r.intelligence, calibration: r.calibration, speed: r.speed, costAxis: r.cost_axis,
          publicAccuracy: s.public_accuracy * 100, sealedAccuracy: s.sealed_accuracy * 100,
          p50Latency: s.speed.p50_s_adjusted, p95Latency: s.speed.p95_s_adjusted } };
    });
  },
};
export default board;
