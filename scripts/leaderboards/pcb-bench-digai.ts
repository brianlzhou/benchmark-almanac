// PCB-Bench (ICLR 2026) evaluates LLMs on printed circuit board placement and routing reasoning.
// This importer captures Table 2 from the official project page image (double-transcribed and
// SHA-256 verified), using the unweighted mean Task 1 multiple-choice accuracy across macro and
// micro placement and routing splits as the headline alongside all eight QA BERTScore and SBERT measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://digailab.github.io/PCB-Bench/figs/tab_2.png';
const SHA256 = 'ab6ba52e7e1f034259c7d6cb76def6d128a8c6143c11f1bedd07f93e0c1d4327';

type RawEntry = readonly [
  model: string,
  setting: string | undefined,
  pMacroAcc: number, pMacroBert: number, pMacroSbert: number,
  pMicroAcc: number, pMicroBert: number, pMicroSbert: number,
  rMacroAcc: number, rMacroBert: number, rMacroSbert: number,
  rMicroAcc: number, rMicroBert: number, rMicroSbert: number,
];

const ENTRIES: ReadonlyArray<RawEntry> = [
  ['GPT-4o (snapshot unspecified)', undefined, 92.74, 0.8244, 0.4756, 93.82, 0.8069, 0.5664, 98.32, 0.8267, 0.5046, 91.13, 0.8169, 0.5647],
  ['GPT-5', undefined, 88.27, 0.8180, 0.4502, 91.79, 0.8214, 0.5334, 99.16, 0.8193, 0.4588, 90.17, 0.8211, 0.5137],
  ['Claude-Opus-4.1', undefined, 93.30, 0.8138, 0.4772, 94.35, 0.8054, 0.5643, 99.16, 0.8164, 0.4837, 92.32, 0.8119, 0.5738],
  ['Gemini-2.5-Pro (snapshot unspecified)', undefined, 86.03, 0.8073, 0.4172, 90.82, 0.8069, 0.4804, 98.31, 0.8068, 0.4428, 88.73, 0.8068, 0.4840],
  ['DeepSeek-Chat-V3.1-671B', undefined, 92.74, 0.8306, 0.4912, 93.64, 0.8127, 0.5652, 97.48, 0.8310, 0.4939, 88.49, 0.8217, 0.5657],
  ['LLaMA-4-Maverick-400B', undefined, 77.66, 0.8155, 0.4931, 49.07, 0.8074, 0.5689, 92.43, 0.8186, 0.5149, 71.70, 0.8104, 0.5564],
  ['InternVL3-78B', undefined, 90.50, 0.7936, 0.4162, 93.91, 0.7360, 0.3035, 97.48, 0.8071, 0.4677, 91.37, 0.8056, 0.5511],
  ['MythoMax-L2-13B', undefined, 65.92, 0.8257, 0.4496, 54.37, 0.8101, 0.5406, 68.07, 0.8262, 0.4676, 53.00, 0.8113, 0.5173],
  ['Rocinante-12B', undefined, 82.12, 0.8174, 0.4707, 77.41, 0.8054, 0.5755, 89.92, 0.8227, 0.4953, 77.70, 0.8141, 0.5590],
  ['Ministral-3B', undefined, 59.21, 0.8196, 0.4798, 42.71, 0.8027, 0.5800, 74.79, 0.8204, 0.4918, 54.68, 0.8108, 0.5552],
  ['Qwen2.5-7B-Instruct', undefined, 84.36, 0.7302, 0.2236, 86.85, 0.7287, 0.2978, 94.12, 0.7305, 0.2130, 82.50, 0.7270, 0.2081],
  ['Qwen2.5-7B-Instruct', 'Domain-specific QLoRA', 90.50, 0.6203, 0.4687, 89.39, 0.6329, 0.5971, 97.48, 0.6297, 0.4764, 82.50, 0.6267, 0.5414],
  ['Qwen2.5-7B-Instruct', 'Domain-specific RAG', 88.26, 0.6145, 0.5050, 87.44, 0.6259, 0.5687, 92.43, 0.6234, 0.5365, 85.61, 0.6122, 0.5456],
];

const ROWS: LeaderboardRow[] = ENTRIES.map(
  ([model, setting, pMacroAcc, pMacroBert, pMacroSbert, pMicroAcc, pMicroBert, pMicroSbert, rMacroAcc, rMacroBert, rMacroSbert, rMicroAcc, rMicroBert, rMicroSbert]) => ({
    model,
    ...(setting ? { setting } : {}),
    score: Number(((pMacroAcc + pMicroAcc + rMacroAcc + rMicroAcc) / 4).toFixed(2)),
    metrics: {
      placementMacroAcc: pMacroAcc,
      placementMicroAcc: pMicroAcc,
      routingMacroAcc: rMacroAcc,
      routingMicroAcc: rMicroAcc,
      placementMacroBert: pMacroBert,
      placementMacroSbert: pMacroSbert,
      placementMicroBert: pMicroBert,
      placementMicroSbert: pMicroSbert,
      routingMacroBert: rMacroBert,
      routingMacroSbert: rMacroSbert,
      routingMicroBert: rMicroBert,
      routingMicroSbert: rMicroSbert,
    },
  })
);

const board: Leaderboard = {
  benchmark: 'pcb-bench-digai',
  static: 'paper',
  url: 'https://digailab.github.io/PCB-Bench/',
  feed: FEED,
  terms: 'Public ICLR 2026 project page table image. Scores remain credited to Li et al.',
  headline: 'Headline is the unweighted mean Task 1 multiple-choice accuracy in percent across macro and micro placement and routing splits in Table 2.',
  aliases: {
    'DeepSeek-Chat-V3.1-671B': 'deepseek-v3-1',
    'LLaMA-4-Maverick-400B': 'llama-4-maverick',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
  },
  parts: {
    placementMacroAcc: { name: 'Placement macro CQ', group: 'Task 1 choice accuracy', unit: '%', better: 'higher' },
    placementMicroAcc: { name: 'Placement micro CQ', group: 'Task 1 choice accuracy', unit: '%', better: 'higher' },
    routingMacroAcc: { name: 'Routing macro CQ', group: 'Task 1 choice accuracy', unit: '%', better: 'higher' },
    routingMicroAcc: { name: 'Routing micro CQ', group: 'Task 1 choice accuracy', unit: '%', better: 'higher' },
  },
  stats: {
    placementMacroBert: { name: 'Placement macro QA BERTScore', unit: 'score', better: 'higher' },
    placementMacroSbert: { name: 'Placement macro QA SBERT', unit: 'score', better: 'higher' },
    placementMicroBert: { name: 'Placement micro QA BERTScore', unit: 'score', better: 'higher' },
    placementMicroSbert: { name: 'Placement micro QA SBERT', unit: 'score', better: 'higher' },
    routingMacroBert: { name: 'Routing macro QA BERTScore', unit: 'score', better: 'higher' },
    routingMacroSbert: { name: 'Routing macro QA SBERT', unit: 'score', better: 'higher' },
    routingMicroBert: { name: 'Routing micro QA BERTScore', unit: 'score', better: 'higher' },
    routingMicroSbert: { name: 'Routing micro QA SBERT', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    return checked(await chartRows(FEED, SHA256, ROWS), 13);
  },
};

export default board;
