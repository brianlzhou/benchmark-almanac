// MEGA-Bench (TIGER-Lab). The project page builds its leaderboard in the browser from
// static/data/all_summary.json, keyed by internal model names ("GPT_4o", "Claude_3.5_new"): per model the
// Core score with and without chain of thought, the Open score and overall_score (0 to 1), which the page
// sorts by and which is the score here (times 100). The page maps internal keys to display names in its
// script. The aliases below do the same for keys whose snapshot the resolver cannot infer.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://tiger-ai-lab.github.io/MEGA-Bench/static/data/all_summary.json';

const board: Leaderboard = {
  benchmark: 'mega-bench',
  url: 'https://tiger-ai-lab.github.io/MEGA-Bench/',
  feed: `${FEED} (overall_score)`,
  terms: 'JSON file on the MEGA-Bench GitHub Pages site that the page loads; the MEGA-Bench repository is Apache-2.0.',
  parts: {
    core: { name: 'Core', unit: '%', note: 'Higher of the Core chain-of-thought and non-chain-of-thought macro mean scores, matching the leaderboard table.' },
    openEnded: { name: 'Open-ended', unit: '%' },
  },
  stats: {
    coreCot: { name: 'Core with CoT', unit: '%', better: 'higher' },
    coreNonCot: { name: 'Core without CoT', unit: '%', better: 'higher' },
    coreCotMicro: { name: 'Core with CoT micro mean', unit: '%', better: 'higher' },
    coreNonCotMicro: { name: 'Core without CoT micro mean', unit: '%', better: 'higher' },
    openMicro: { name: 'Open-ended micro mean', unit: '%', better: 'higher' },
  },
  // the page's own display names: "GPT-4o (0513)", "Claude-3.5-Sonnet (0620)", "Claude-3.5-Sonnet (1022)"
  aliases: {
    GPT_4o: 'gpt-4o-may-2024',
    'Claude_3.5': 'claude-3-5-sonnet',
    'Claude_3.5_new': 'claude-3-5-sonnet-october-2024',
    'Gemini_1.5_pro_002': 'gemini-1-5-pro-sept-2024',
    'Gemini_1.5_flash_002': 'gemini-1-5-flash-sep-2024',
    GPT_4o_mini: 'gpt-4o-mini',
    Qwen2_VL_72B: 'qwen2-vl-72b-instruct',
    Qwen2_VL_7B: 'qwen2-vl-7b-instruct',
    Qwen2_VL_2B: 'qwen2-vl-2b-instruct',
    InternVL2_76B: 'internvl2-llama3-76b',
    InternVL2_8B: 'internvl2-8b',
    InternVL2_2B: 'internvl2-2b',
    llava_onevision_72B: 'llava-onevision-72b',
    llava_onevision_7B: 'llava-onevision-7b',
    'MiniCPM_v2.6': 'minicpm-v-2-6',
    'Phi-3.5-vision': 'phi-3-5-vision-instruct',
    Pixtral_12B: 'pixtral-12b',
    Llama_3_2_11B: 'llama-3-2-11b',
    Idefics3: 'idefics3-8b-llama3',
    NVLM: 'nvlm-d-72b',
  },
  async fetch() {
    type Split = { macro_mean_score?: number; micro_mean_score?: number };
    const data = await fetchJson<Record<string, { overall_score?: number; core_cot?: Split; core_noncot?: Split; open?: Split }>>(FEED);
    const pct = (v: number | undefined) => (typeof v === 'number' && Number.isFinite(v) ? Number((v * 100).toFixed(2)) : undefined);
    const rows: LeaderboardRow[] = [];
    for (const [key, m] of Object.entries(data)) {
      if (typeof m.overall_score !== 'number') continue;
      const metrics: Record<string, number> = {};
      const coreCot = pct(m.core_cot?.macro_mean_score);
      const coreNonCot = pct(m.core_noncot?.macro_mean_score);
      const coreVals = [coreCot, coreNonCot].filter((v): v is number => v !== undefined);
      if (coreVals.length) metrics.core = Math.max(...coreVals);
      const openEnded = pct(m.open?.macro_mean_score);
      if (openEnded !== undefined) metrics.openEnded = openEnded;
      if (coreCot !== undefined) metrics.coreCot = coreCot;
      if (coreNonCot !== undefined) metrics.coreNonCot = coreNonCot;
      const coreCotMicro = pct(m.core_cot?.micro_mean_score);
      if (coreCotMicro !== undefined) metrics.coreCotMicro = coreCotMicro;
      const coreNonCotMicro = pct(m.core_noncot?.micro_mean_score);
      if (coreNonCotMicro !== undefined) metrics.coreNonCotMicro = coreNonCotMicro;
      const openMicro = pct(m.open?.micro_mean_score);
      if (openMicro !== undefined) metrics.openMicro = openMicro;
      rows.push({ model: key, score: m.overall_score * 100, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;
