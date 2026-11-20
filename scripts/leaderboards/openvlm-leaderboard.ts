// OpenVLM Leaderboard (OpenCompass). The opencompass/open_vlm_leaderboard Space renders OpenVLM.json, the
// same file mmbench.ts reads: per model a META block and one entry per benchmark. The main table's "Avg
// Score" is the mean over eight default benchmarks (MMBench v1.1 as the mean of its English and Chinese test
// sets, MMStar, MMMU val, MathVista, OCRBench divided by 10, AI2D, HallusionBench and MMVet), left empty when
// any of them is missing. gen_table.py is reproduced here and Avg Score is the score. The META time is the
// row date, and a "(0513, detail-high)" suffix becomes the snapshot date and the image detail setting, as in
// mmbench.ts. The VCR and A-Bench importers read their own columns through openvlmRows. The file is a
// snapshot whose newest rows date from 2025.
import type { Leaderboard } from './types.ts';
import { OPENVLM_FEED, openvlmRows, type OpenVlmEntry } from '../lib/boards/openvlm.ts';

export { OPENVLM_FEED, openvlmInfo, openvlmRows, type OpenVlmEntry } from '../lib/boards/openvlm.ts';
export const OPENVLM_URL = 'https://huggingface.co/spaces/opencompass/open_vlm_leaderboard';
export const OPENVLM_TERMS = "OpenCompass's published leaderboard data file, which the Apache-2.0 Space renders; the file states no license.";

/** OpenCompass names the shared resolver cannot place (the same as mmbench.ts). */
export const OPENVLM_ALIASES: Record<string, string> = {
  'Claude3.5-Sonnet-20241022': 'claude-3-5-sonnet-october-2024',
  'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
  'Qwen2-VL-7B': 'qwen2-vl-7b-instruct',
  'LLaVA-OneVision-72B': 'llava-onevision-72b',
  'InternVL2.5-78B': 'internvl2-5-78b',
  'InternVL2-40B': 'internvl2-40b',
};

const overall = (e: OpenVlmEntry, key: string, field = 'Overall') => e[key]?.[field];

function scores(e: OpenVlmEntry) {
  const cn = overall(e, 'MMBench_TEST_CN_V11');
  const en = overall(e, 'MMBench_TEST_EN_V11');
  const ocr = overall(e, 'OCRBench', 'Final Score');
  return {
    mmbench:
    cn !== undefined && en !== undefined ? Number(((cn + en) / 2).toFixed(1)) : undefined,
    mmstar: overall(e, 'MMStar'),
    mmmu: overall(e, 'MMMU_VAL'),
    mathvista: overall(e, 'MathVista'),
    ocrbench: ocr !== undefined ? ocr / 10 : undefined,
    ai2d: overall(e, 'AI2D'),
    hallusionbench: overall(e, 'HallusionBench'),
    mmvet: overall(e, 'MMVet'),
  };
}

function avgScore(e: OpenVlmEntry): number | undefined {
  const values = Object.values(scores(e));
  if (!values.every((v): v is number => typeof v === 'number')) return undefined;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

const board: Leaderboard = {
  benchmark: 'openvlm-leaderboard',
  parts: {
    mmbench: 'MMBench v1.1', mmstar: 'MMStar', mmmu: 'MMMU (validation)', mathvista: 'MathVista',
    ocrbench: 'OCRBench', ai2d: 'AI2D', hallusionbench: 'HallusionBench', mmvet: 'MM-Vet',
  },
  verified: 'marked verified by OpenCompass',
  url: OPENVLM_URL,
  feed: `${OPENVLM_FEED} (Avg Score over the eight default benchmarks)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  fetch: () => openvlmRows(avgScore, e => Object.fromEntries(Object.entries(scores(e)).filter((pair): pair is [string, number] => typeof pair[1] === 'number'))),
};
export default board;
