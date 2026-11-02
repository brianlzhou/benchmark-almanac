// OpenVLM Leaderboard (OpenCompass). The opencompass/open_vlm_leaderboard Space renders OpenVLM.json, the
// same file mmbench.ts reads: per model a META block and one entry per benchmark. The main table's "Avg
// Score" is the mean over eight default benchmarks (MMBench v1.1 as the mean of its English and Chinese test
// sets, MMStar, MMMU val, MathVista, OCRBench divided by 10, AI2D, HallusionBench and MMVet), left empty when
// any of them is missing. gen_table.py is reproduced here and Avg Score is the score. The META time is the
// row date, and a "(0513, detail-high)" suffix becomes the snapshot date and the image detail setting, as in
// mmbench.ts. The VCR and A-Bench importers read their own columns through openvlmRows. The file is a
// snapshot whose newest rows date from 2025.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

// the host serves this file over plain HTTP only
export const OPENVLM_FEED = 'http://opencompass.openxlab.space/assets/OpenVLM.json';
export const OPENVLM_URL = 'https://huggingface.co/spaces/opencompass/open_vlm_leaderboard';
export const OPENVLM_TERMS = "OpenCompass's published leaderboard data file, which the Apache-2.0 Space renders; the file states no license.";

export type OpenVlmEntry = Record<string, Record<string, number> | undefined> & {
  META?: { Method?: [string, string?]; Time?: string };
};

let cache: Promise<Record<string, OpenVlmEntry>> | undefined;
const load = () => (cache ??= fetchJson<{ results: Record<string, OpenVlmEntry> }>(OPENVLM_FEED).then((d) => d.results));

/** One row per model whose `pick` returns a number, with the name, date and setting read as mmbench.ts does. */
export async function openvlmRows(pick: (e: OpenVlmEntry) => number | undefined): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (const e of Object.values(await load())) {
    const score = pick(e);
    let model = e.META?.Method?.[0]?.trim();
    if (!model || typeof score !== 'number' || !Number.isFinite(score)) continue;
    // the registry's only Reka Edge is the 2026 release, not the 2024 model on this board
    if (/^RekaEdge$/i.test(model)) continue;
    let date = e.META?.Time?.replace(/\//g, '-').replace(/-(\d)(?=-|$)/g, '-0$1');
    let setting: string | undefined;
    // "GPT-4o (0513, detail-high)": snapshot month and day, and the image detail level
    const snap = model.match(/\s*\((\d\d)(\d\d), (detail-\w+)\)$/);
    if (snap && date) {
      date = `${date.slice(0, 4)}-${snap[1]}-${snap[2]}`;
      setting = snap[3];
      model = model.slice(0, snap.index).trim();
    }
    rows.push({ model, score, setting, date });
  }
  return rows;
}

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

function avgScore(e: OpenVlmEntry): number | undefined {
  const cn = overall(e, 'MMBench_TEST_CN_V11');
  const en = overall(e, 'MMBench_TEST_EN_V11');
  const ocr = overall(e, 'OCRBench', 'Final Score');
  const parts = [
    cn !== undefined && en !== undefined ? Number(((cn + en) / 2).toFixed(1)) : undefined,
    overall(e, 'MMStar'),
    overall(e, 'MMMU_VAL'),
    overall(e, 'MathVista'),
    ocr !== undefined ? ocr / 10 : undefined,
    overall(e, 'AI2D'),
    overall(e, 'HallusionBench'),
    overall(e, 'MMVet'),
  ];
  if (parts.some((p) => typeof p !== 'number')) return undefined;
  return Number(((parts as number[]).reduce((a, b) => a + b, 0) / parts.length).toFixed(1));
}

const board: Leaderboard = {
  benchmark: 'openvlm-leaderboard',
  url: OPENVLM_URL,
  feed: `${OPENVLM_FEED} (Avg Score over the eight default benchmarks)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  fetch: () => openvlmRows(avgScore),
};
export default board;
