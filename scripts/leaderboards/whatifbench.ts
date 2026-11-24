// WhatIfBench (Zhejiang University, Alibaba Group and City University of Hong Kong, Findings of EMNLP 2026):
// 220 open-domain long-horizon counterfactual causal reasoning questions graded by PRISM, averaging a causal-graph
// Process Metric (PM) and rubric adequacy (RM). The GitHub README publishes the fixed Main Results table for six
// frontier LLMs (temperature 0.6, 4,096 tokens, GPT-5.4 unified parser and judge at temperature 0.0).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const PAGE = 'https://github.com/zju-gt/WhatIfBench';
const FEED = 'https://raw.githubusercontent.com/zju-gt/WhatIfBench/main/README.md';

const board: Leaderboard = {
  benchmark: 'whatifbench',
  url: PAGE,
  feed: FEED,
  terms: 'The authors publish the WhatIfBench Main Results table in the public zju-gt/WhatIfBench GitHub repository.',
  static: 'paper',
  parts: {
    stemPm: { name: 'STEM (Process)', group: 'Process metric' },
    hssPm: { name: 'HSS (Process)', group: 'Process metric' },
    hybridPm: { name: 'Hybrid (Process)', group: 'Process metric' },
    stemRm: { name: 'STEM (Rubric)', group: 'Rubric metric' },
    hssRm: { name: 'HSS (Rubric)', group: 'Rubric metric' },
    hybridRm: { name: 'Hybrid (Rubric)', group: 'Rubric metric' },
  },
  stats: {
    overallPm: { name: 'Overall process metric', unit: '%', better: 'higher', note: 'Graph-level causal validity across all 220 questions.' },
    overallRm: { name: 'Overall rubric metric', unit: '%', better: 'higher', note: 'Answer-level explanatory adequacy across all 220 questions.' },
  },
  async fetch() {
    const md = await fetchText(FEED);
    const head = ['Model', 'STEM PM', 'STEM RM', 'HSS PM', 'HSS RM', 'Hybrid PM', 'Hybrid RM', 'Overall PM', 'Overall RM', 'Final'];
    const table = markdownTables(md).find((t) => head.every((h, i) => t[0]?.[i] === h));
    if (!table) throw new Error('WhatIfBench Main Results table missing');
    const out: LeaderboardRow[] = table.slice(1).map((row) => {
      const model = row[0]?.trim();
      const vals = row.slice(1, 10).map(num);
      if (!model || vals.some((v) => v === undefined)) {
        throw new Error(`WhatIfBench row changed: ${row.join(' | ')}`);
      }
      return {
        model,
        score: vals[8]!,
        metrics: {
          stemPm: vals[0]!,
          stemRm: vals[1]!,
          hssPm: vals[2]!,
          hssRm: vals[3]!,
          hybridPm: vals[4]!,
          hybridRm: vals[5]!,
          overallPm: vals[6]!,
          overallRm: vals[7]!,
        },
      };
    });
    if (out.length < 6) throw new Error(`WhatIfBench table changed: only ${out.length} rows`);
    return out;
  },
};

export default board;
