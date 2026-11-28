// KernelShift (CMU L3): evaluates AI coding agents on porting and optimizing 79 ARM SVE/SVE2/SME2 kernels across four
// open-source libraries (ncnn, llama.cpp, SIMD Loops, KleidiAI). Reads the inline var ROWS leaderboard array from
// cmu-l3.github.io/kernel-shift/ and computes the geometric mean of Speedup@40 across the four suites as the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://cmu-l3.github.io/kernel-shift/';

const board: Leaderboard = {
  benchmark: 'kernelshift',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on GitHub Pages by CMU L3 with no robots.txt restrictions.',
  harnesses: 'system',
  reference: ['Tool-call loop'],
  headline: 'Geometric mean of Speedup@40 across the four suites (ncnn, llama.cpp, SIMD Loops, and KleidiAI), since the leaderboard reports each suite individually.',
  parts: {
    ncnn: { name: 'ncnn', group: 'Suite', unit: 'speedup', better: 'higher', note: 'Speedup@40 across 23 ncnn kernels.' },
    llamaCpp: { name: 'llama.cpp', group: 'Suite', unit: 'speedup', better: 'higher', note: 'Speedup@40 across 26 llama.cpp kernels.' },
    simdLoops: { name: 'SIMD Loops', group: 'Suite', unit: 'speedup', better: 'higher', note: 'Speedup@40 across 24 SIMD Loops kernels.' },
    kleidiAi: { name: 'KleidiAI', group: 'Suite', unit: 'speedup', better: 'higher', note: 'Speedup@40 across 6 KleidiAI kernels.' },
    ncnnPass: { name: 'ncnn', group: 'Pass rate', unit: '%', better: 'higher' },
    llamaCppPass: { name: 'llama.cpp', group: 'Pass rate', unit: '%', better: 'higher' },
    simdLoopsPass: { name: 'SIMD Loops', group: 'Pass rate', unit: '%', better: 'higher' },
    kleidiAiPass: { name: 'KleidiAI', group: 'Pass rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const m = html.match(/var ROWS\s*=\s*\[([\s\S]*?)\];/);
    if (!m) throw new Error('KernelShift var ROWS array not found');
    const out: LeaderboardRow[] = [];
    const rowRe = /\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]\s*,\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]\s*,\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]\s*,\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]\s*\]/g;
    for (const hit of m[1].matchAll(rowRe)) {
      const harness = hit[1].trim();
      const model = hit[2].trim();
      const [ncnn, ncnnPass, llamaCpp, llamaCppPass, simdLoops, simdLoopsPass, kleidiAi, kleidiAiPass] = hit.slice(3).map(Number);
      if (![ncnn, llamaCpp, simdLoops, kleidiAi].every((v) => Number.isFinite(v) && v > 0)) {
        throw new Error(`Invalid KernelShift speedups for ${model} (${harness})`);
      }
      const geomean = Math.pow(ncnn * llamaCpp * simdLoops * kleidiAi, 0.25);
      out.push({
        model,
        harness,
        score: Number(geomean.toFixed(3)),
        metrics: {
          ncnn,
          llamaCpp,
          simdLoops,
          kleidiAi,
          ncnnPass,
          llamaCppPass,
          simdLoopsPass,
          kleidiAiPass,
        },
      });
    }
    if (out.length < 10) throw new Error(`KernelShift returned only ${out.length} rows`);
    return out;
  },
};
export default board;
