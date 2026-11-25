// McStasBench measures the pass rate on 16 neutron simulation tasks. The authors’ JSON includes the main matrix and separate held-out instruments.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/ljding94/NeutronGym/main/benchmark/results/m6_results.json";
interface Entry { model: string; arm: string; valid_episodes: number; passes: number; pass_rate: number; levels: Record<string,number>; infra_excluded: number; leak_invalid: number }

const board: Leaderboard = {
  benchmark: "mcstasbench",
  url: "https://github.com/ljding94/NeutronGym/blob/main/benchmark/RESULTS.md",
  feed: FEED,
  terms: "No repository license was listed when checked on 2026-11-20. The JSON includes one incomplete GPT run that the published table excludes. https://github.com/ljding94/NeutronGym GitHub requests a one-second crawl delay.",
  stats: { PASS: { name: 'Passed episodes', unit: 'count', better: 'higher' }, L4: { name: 'Level 4 passes', unit: 'count', better: 'higher' }, L3: { name: 'Level 3 passes', unit: 'count', better: 'higher' }, L2: { name: 'Level 2 passes', unit: 'count', better: 'higher' }, L1: { name: 'Level 1 passes', unit: 'count', better: 'higher' }, L0: { name: 'Level 0 passes', unit: 'count', better: 'higher' }, validEpisodes: { name: 'Valid episodes', unit: 'count' }, infraExcluded: { name: 'Infrastructure-excluded episodes', unit: 'count', better: 'lower' }, leakInvalid: { name: 'Leak-invalidated episodes', unit: 'count', better: 'lower' }, heldOutPassRate: { name: 'Held-out pass rate', unit: '%', better: 'higher' }, heldOutPasses: { name: 'Held-out passes', unit: 'count', better: 'higher' } },
  aliases: { anthropic_claude_haiku_4_5: 'claude-haiku-4-5', anthropic_claude_sonnet_5: 'claude-sonnet-5', google_gemini_3_5_flash_lite: 'gemini-3-5-flash-lite', google_gemini_3_6_flash: 'gemini-3-6-flash', meta_llama_llama_4_maverick: 'llama-4-maverick', qwen3_32b: 'qwen3-32b', qwen3_8b: 'qwen3-8b' },
  async fetch() {
    const data = await fetchJson<{matrix: Entry[]; held_out_final_pass: Entry[]}>(FEED);
    const matrix = data.matrix.filter(r => r.valid_episodes === 16);
    if (matrix.length < 14) throw new Error('Missing full-matrix configurations');
    return matrix.map(r => {
      if (!r.model || !r.arm || Math.abs(r.pass_rate - r.passes / r.valid_episodes) > 0.0001) throw new Error('Invalid matrix pass rate');
      const held = data.held_out_final_pass.find(h => h.model === r.model && h.arm === r.arm);
      return { model: r.model, setting: r.arm, score: r.pass_rate * 100, metrics: { ...r.levels, validEpisodes: r.valid_episodes,
        infraExcluded: r.infra_excluded, leakInvalid: r.leak_invalid, ...(held ? { heldOutPassRate: held.pass_rate * 100, heldOutPasses: held.passes } : {}) } };
    });
  },
};
export default board;
