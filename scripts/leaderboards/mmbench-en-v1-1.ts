// MMBench-EN v1.1. OpenCompass, which made MMBench, publishes its VLM leaderboard data as OpenVLM.json (the
// same file mmbench.ts reads for v1.0): per model a META block (display name, org, evaluation time) and one
// entry per benchmark. MMBench_TEST_EN_V11.Overall (CircularEval accuracy, 0 to 100) is the score. This is
// the v1.1 test split, which is the only v1.1 split OpenCompass publishes; lab cards often report the dev
// split, which runs about a point apart. The live board on rank.opencompass.org.cn shows only the mean of
// the English and Chinese test splits, so it is not read. The META time is the row date, so the resolver
// picks the snapshot current then; "GPT-4o (0513, detail-high)" becomes GPT-4o dated 2024-05-13 with the
// image detail level as the setting. Keep each capability score and the model metadata. The file is a snapshot (2025-09-17).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

// the host serves this file over plain HTTP only
export const OPENVLM_FEED = 'http://opencompass.openxlab.space/assets/OpenVLM.json';
export const OPENVLM_TERMS =
  "OpenCompass's published leaderboard data file, which states no license; the VLMEvalKit and MMBench repositories are Apache-2.0. rank.opencompass.org.cn robots.txt disallows only /assets/ and model-detail pages on that host.";
export const OPENVLM_ALIASES: Record<string, string> = {
  // the plain name is the May 2024 release (-001); the September update is listed as Gemini-1.5-Flash-002
  'Gemini-1.5-Flash': 'gemini-1-5-flash-may-2024',
  'Claude3.5-Sonnet-20241022': 'claude-3-5-sonnet-october-2024',
  'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
  'Qwen2-VL-7B': 'qwen2-vl-7b-instruct',
  'LLaVA-OneVision-72B': 'llava-onevision-72b',
  'InternVL2.5-78B': 'internvl2-5-78b',
  'InternVL2-40B': 'internvl2-40b',
  'Gemini-1.5-Pro-002': 'gemini-1-5-pro-sept-2024',
  'Gemini-1.5-Flash-002': 'gemini-1-5-flash-sep-2024',
  // evaluated 2025-04-07, when chatgpt-4o-latest served the March 2025 GPT-4o
  'ChatGPT-4o-latest': 'gpt-4o-mar-2025',
};

export const MMBENCH_PARTS = {
  'AR': { name: 'Attribute reasoning', group: 'Capability' },
  'Action Recognition': { name: 'Action Recognition', group: 'Task' },
  'Attribute Comparison': { name: 'Attribute Comparison', group: 'Task' },
  'Attribute Recognition': { name: 'Attribute Recognition', group: 'Task' },
  'CP': { name: 'Coarse perception', group: 'Capability' },
  'Celebrity Recognition': { name: 'Celebrity Recognition', group: 'Task' },
  'FP-C': { name: 'Cross-instance fine-grained perception', group: 'Capability' },
  'FP-S': { name: 'Single-instance fine-grained perception', group: 'Capability' },
  'Function Reasoning': { name: 'Function Reasoning', group: 'Task' },
  'Future Prediction': { name: 'Future Prediction', group: 'Task' },
  'Identity Reasoning': { name: 'Identity Reasoning', group: 'Task' },
  'Image Emotion': { name: 'Image Emotion', group: 'Task' },
  'Image Quality': { name: 'Image Quality', group: 'Task' },
  'Image Scene': { name: 'Image Scene', group: 'Task' },
  'Image Style': { name: 'Image Style', group: 'Task' },
  'Image Topic': { name: 'Image Topic', group: 'Task' },
  'LR': { name: 'Logical reasoning', group: 'Capability' },
  'Nature Relation': { name: 'Nature Relation', group: 'Task' },
  'Object Localization': { name: 'Object Localization', group: 'Task' },
  'Ocr': { name: 'Ocr', group: 'Task' },
  'Physical Property Reasoning': { name: 'Physical Property Reasoning', group: 'Task' },
  'Physical Relation': { name: 'Physical Relation', group: 'Task' },
  'RR': { name: 'Relation reasoning', group: 'Capability' },
  'Social Relation': { name: 'Social Relation', group: 'Task' },
  'Spatial Relationship': { name: 'Spatial Relationship', group: 'Task' },
  'Structuralized Imagetext Understanding': { name: 'Structuralized Imagetext Understanding', group: 'Task' },
};

type Entry = { META?: { Method?: [string, string?]; Time?: string; Verified?: string; OpenSource?: string; Parameters?: string } } & Record<string, Record<string, unknown> | undefined>;

/** Rows for one OpenVLM.json benchmark key, scored by its Overall value. */
export async function openVlmRows(benchKey: string): Promise<LeaderboardRow[]> {
  const { results } = await fetchJson<{ results: Record<string, Entry> }>(OPENVLM_FEED);
  const rows: LeaderboardRow[] = [];
  for (const e of Object.values(results)) {
    const score = (e[benchKey] as { Overall?: number } | undefined)?.Overall;
    let model = e.META?.Method?.[0]?.trim();
    if (!model || typeof score !== 'number') continue;
    let date = e.META?.Time?.replace(/\//g, '-');
    let setting: string | undefined;
    // "GPT-4o (0513, detail-high)": snapshot month and day, and the image detail level
    const snap = model.match(/\s*\((\d\d)(\d\d), (detail-\w+)\)$/);
    if (snap && date) {
      const evalDate = date;
      date = `${date.slice(0, 4)}-${snap[1]}-${snap[2]}`;
      // the snapshot predates the evaluation: "(1106)" run in 2024 is the November 2023 snapshot
      if (date > evalDate) date = `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`;
      setting = snap[3];
      model = model.slice(0, snap.index).trim();
    }
    // GPT-4V from April 2024 on is GPT-4 Turbo with vision (gpt-4-turbo-2024-04-09)
    if (model === 'GPT-4v' && date && date >= '2024-04-09') model = 'GPT-4 Turbo';
    // "-CoT" rows are the same model prompted for chain of thought
    if (/-CoT$/.test(model)) {
      model = model.replace(/-CoT$/, '');
      setting = setting ? `${setting}, cot` : 'cot';
    }
    const meta = e.META;
    const metrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(e[benchKey] ?? {})) {
      if (key !== 'Overall' && typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
    }
    rows.push({ model, score, setting, date, metrics,

      verified: meta?.Verified === 'Yes' ? true : meta?.Verified === 'No' ? false : undefined,
      open: meta?.OpenSource === 'Yes' ? true : meta?.OpenSource === 'No' ? false : undefined,
      params: /^\d+(?:\.\d+)?B$/.test(meta?.Parameters ?? '') ? parseFloat(meta!.Parameters!) : undefined,
    });
  }
  if (!rows.length) throw new Error(`no ${benchKey} rows in OpenVLM.json`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'mmbench-en-v1-1',
  parts: MMBENCH_PARTS,
  verified: 'marked verified by OpenCompass',
  url: 'https://rank.opencompass.org.cn/leaderboard-multimodal',
  feed: `${OPENVLM_FEED} (MMBench_TEST_EN_V11.Overall)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  fetch: () => openVlmRows('MMBench_TEST_EN_V11'),
};
export default board;
