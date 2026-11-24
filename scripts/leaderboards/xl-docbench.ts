// XL-DocBench — Microsoft Research Asia extra-long multimodal document understanding benchmark.
// Reads per-item results (1,345 questions across single-document and cross-document tasks) from
// Hugging Face dataset microsoft/XL-DocBench and computes exact aggregate accuracy, Token F1, and ANLS.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/microsoft/XL-DocBench/raw/main/results/scores.jsonl';

interface EntrySpec {
  model: string;
  setting?: string;
  harness?: string;
  params?: number;
}

const ENTRY_SPECS: Record<string, EntrySpec> = {
  gpt_5_4_img: { model: 'GPT-5.4', setting: 'Image input' },
  gpt_5_4_ocr: { model: 'GPT-5.4', setting: 'OCR input' },
  gpt_5_2_img: { model: 'GPT-5.2', setting: 'Image input' },
  gpt_5_2_ocr: { model: 'GPT-5.2', setting: 'OCR input' },
  kimi_k2_5_img: { model: 'Kimi K2.5', setting: 'Image input' },
  kimi_k2_5_ocr: { model: 'Kimi K2.5', setting: 'OCR input' },
  deepseek_v3_2_ocr: { model: 'DeepSeek-V3.2', setting: 'OCR input' },
  qwen3_5_9b_img: { model: 'Qwen3.5-9B', setting: 'Image input', params: 9 },
  qwen3_5_4b_img: { model: 'Qwen3.5-4B', setting: 'Image input', params: 4 },
  qwen3_5_4b_ocr: { model: 'Qwen3.5-4B', setting: 'OCR input', params: 4 },
  simpledoc_gpt_5_4: { model: 'GPT-5.4', harness: 'SimpleDoc' },
  mdocagent_gpt_5_4: { model: 'GPT-5.4', harness: 'MDocAgent' },
  deepread_gpt_5_4: { model: 'GPT-5.4', harness: 'DeepRead' },
};

const round2 = (v: number) => Math.round(v * 100) / 100;

interface ScoreItem {
  accuracy?: number;
  token_f1?: number;
  anls?: number;
}

interface JsonlRow {
  question_id?: string;
  scores?: Record<string, ScoreItem>;
}

const board: Leaderboard = {
  benchmark: 'xl-docbench',
  feed: FEED,
  url: 'https://officeintelligence.github.io/xl-docbench/',
  terms: 'Public evaluation dataset published on Hugging Face by Microsoft Research Asia.',
  harnesses: 'system',
  parts: {
    singleDoc: { name: 'Single-document', group: 'Document scope' },
    crossDoc: { name: 'Cross-document', group: 'Document scope' },
  },
  stats: {
    tokenF1: { name: 'Token F1', unit: '%', better: 'higher' },
    anls: { name: 'ANLS', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const raw = await fetchText(FEED);
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 1000) throw new Error(`XL-DocBench expected >1000 JSONL lines, got ${lines.length}`);

    const acc = new Map<
      string,
      { n: number; a: number; f1: number; anls: number; sN: number; sA: number; cN: number; cA: number }
    >();

    for (const line of lines) {
      const rec = JSON.parse(line) as JsonlRow;
      const qid = rec.question_id ?? '';
      const isCross = qid.includes('_cross_');
      const scores = rec.scores;
      if (!scores) continue;
      for (const [key, val] of Object.entries(scores)) {
        if (!val || typeof val.accuracy !== 'number') continue;
        let bucket = acc.get(key);
        if (!bucket) {
          bucket = { n: 0, a: 0, f1: 0, anls: 0, sN: 0, sA: 0, cN: 0, cA: 0 };
          acc.set(key, bucket);
        }
        bucket.n += 1;
        bucket.a += val.accuracy;
        bucket.f1 += typeof val.token_f1 === 'number' ? val.token_f1 : 0;
        bucket.anls += typeof val.anls === 'number' ? val.anls : 0;
        if (isCross) {
          bucket.cN += 1;
          bucket.cA += val.accuracy;
        } else {
          bucket.sN += 1;
          bucket.sA += val.accuracy;
        }
      }
    }

    const rows: LeaderboardRow[] = [];
    for (const [key, b] of acc) {
      if (b.n === 0) continue;
      const spec = ENTRY_SPECS[key] ?? { model: key.replace(/_/g, ' ') };
      const metrics: Record<string, number> = {
        tokenF1: round2((b.f1 / b.n) * 100),
        anls: round2((b.anls / b.n) * 100),
      };
      if (b.sN > 0) metrics.singleDoc = round2((b.sA / b.sN) * 100);
      if (b.cN > 0) metrics.crossDoc = round2((b.cA / b.cN) * 100);
      const row: LeaderboardRow = {
        model: spec.model,
        score: round2((b.a / b.n) * 100),
        metrics,
      };
      if (spec.setting) row.setting = spec.setting;
      if (spec.harness) row.harness = spec.harness;
      if (spec.params !== undefined) row.params = spec.params;
      rows.push(row);
    }

    if (rows.length < 10) throw new Error(`XL-DocBench parsed only ${rows.length} model configurations`);
    return rows;
  },
};

export default board;
