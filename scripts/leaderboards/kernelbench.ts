// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// KernelBench (Stanford Scaling Intelligence Lab) evaluates LLM generation of fast, correct CUDA kernels across
// 250 tasks split into Level 1 (single operators), Level 2 (fusion patterns) and Level 3 (full architectures).
// This importer reads Table 1 of the KernelBench paper (arXiv:2502.10517), which reports fast_1 (percentage of
// tasks where a generated kernel is both correct and faster than PyTorch Eager or torch.compile on NVIDIA L40S).
// The headline is the plain mean of fast_1 over PyTorch Eager across Levels 1, 2 and 3, with all six columns kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { PAPER_TERMS, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const FEED = 'https://arxiv.org/html/2502.10517';

const pct = (s?: string) => {
  const m = s?.replace(/\s+/g, '').match(/^(\d+(?:\.\d+)?)%$/);
  return m ? Number(m[1]) : undefined;
};

const board: Leaderboard = {
  benchmark: 'kernelbench',
  static: 'paper',
  url: 'https://arxiv.org/abs/2502.10517',
  feed: FEED,
  terms: `${PAPER_TERMS} https://arxiv.org/abs/2502.10517`,
  headline: 'The paper reports no overall score, so this is the plain mean of fast_1 over PyTorch Eager across Levels 1, 2 and 3.',
  parts: {
    level1: { name: 'Level 1 (PyTorch Eager)', group: 'PyTorch Eager' },
    level2: { name: 'Level 2 (PyTorch Eager)', group: 'PyTorch Eager' },
    level3: { name: 'Level 3 (PyTorch Eager)', group: 'PyTorch Eager' },
    level1Compile: { name: 'Level 1 (torch.compile)', group: 'torch.compile' },
    level2Compile: { name: 'Level 2 (torch.compile)', group: 'torch.compile' },
    level3Compile: { name: 'Level 3 (torch.compile)', group: 'torch.compile' },
  },
  aliases: {
    'OpenAI o1': 'o1',
    'Llama 3.1-70B Inst.': 'llama-3-1-70b',
    'Llama 3.1-405B Inst.': 'llama-3-1-405b',
  },
  async fetch() {
    const all = paperTables(await paperHtml(FEED)).map(grid);
    const tbl = all.find(
      (t) =>
        t.length >= 9 &&
        t[0]?.some((c) => /PyTorch Eager/i.test(c)) &&
        t[0]?.some((c) => /torch\.compile/i.test(c)) &&
        t[1]?.join('|') === 'KernelBench Level|1|2|3|1|2|3',
    );
    if (!tbl) throw new Error('KernelBench Table 1 (fast_1 over PyTorch Eager and torch.compile) not found');
    const rows: LeaderboardRow[] = [];
    for (const r of tbl.slice(2)) {
      const model = r[0]?.trim();
      const vals = r.slice(1, 7).map(pct);
      if (!model || vals.some((v) => v === undefined)) throw new Error(`Invalid KernelBench Table 1 row: ${r.join(' | ')}`);
      const [l1, l2, l3, c1, c2, c3] = vals as number[];
      const score = Number(((l1 + l2 + l3) / 3).toFixed(2));
      rows.push({
        model,
        score,
        setting: 'Single attempt, NVIDIA L40S',
        metrics: {
          level1: l1,
          level2: l2,
          level3: l3,
          level1Compile: c1,
          level2Compile: c2,
          level3Compile: c3,
        },
      });
    }
    return checked(rows, 7);
  },
};
export default board;
