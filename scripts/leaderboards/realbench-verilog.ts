// RealBench Verilog generation benchmark from arXiv:2507.16200 HTML Table 2.
// Headline is the mean of module-level formal@1 and system-level formal@1 (0% for all models in Table 2).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2507.16200';

function num(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

const board: Leaderboard = {
  benchmark: 'realbench-verilog',
  static: 'paper',
  url: FEED,
  feed: FEED,
  terms: 'The paper uses CC BY-NC-SA 4.0. https://creativecommons.org/licenses/by-nc-sa/4.0/',
  headline: 'Mean of module-level formal pass@1 and system-level formal pass@1 across RealBench Verilog designs.',
  parts: {
    moduleSyntax: { name: 'Module syntax pass@1' },
    moduleSyntaxAt5: { name: 'Module syntax pass@5' },
    moduleFunction: { name: 'Module functional pass@1' },
    moduleFunctionAt5: { name: 'Module functional pass@5' },
    moduleFormal: { name: 'Module formal pass@1' },
    moduleFormalAt5: { name: 'Module formal pass@5' },
    systemSyntax: { name: 'System syntax pass@1' },
    systemSyntaxAt5: { name: 'System syntax pass@5' },
    systemFunction: { name: 'System functional pass@1' },
    systemFunctionAt5: { name: 'System functional pass@5' },
    systemFormal: { name: 'System formal pass@1' },
    systemFormalAt5: { name: 'System formal pass@5' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find((t) => t[0]?.[0] === 'Benchmarks' && t[0]?.[1] === 'Metrics' && t.some((r) => /RealBench-Module/i.test(r[0] ?? '')));
    if (!table) throw new Error('RealBench Verilog Table 2 missing from arXiv HTML');

    const modelHeaders = table[0].slice(2).map((h) => h.trim());
    const modFormal5Idx = table.findIndex((r) => /RealBench-Module/i.test(r[0] ?? ''));
    const sysZeroIdx = table.findIndex((r) => /RealBench-System/i.test(r[0] ?? ''));
    if (modFormal5Idx < 5 || sysZeroIdx < modFormal5Idx + 3) {
      throw new Error('Unexpected RealBench-Module / RealBench-System row structure in Table 2');
    }

    // In grid(T2), RealBench-Module spans rows [modFormal5Idx-5 .. modFormal5Idx] (syntax@1, syntax@5, func@1, func@5, formal@1, formal@5)
    // and RealBench-System spans rows [modFormal5Idx+1 .. sysZeroIdx] (syntax@1, syntax@5, and all-zero func/formal note)
    const rModSyn1 = table[modFormal5Idx - 5];
    const rModSyn5 = table[modFormal5Idx - 4];
    const rModFun1 = table[modFormal5Idx - 3];
    const rModFun5 = table[modFormal5Idx - 2];
    const rModFor1 = table[modFormal5Idx - 1];
    const rModFor5 = table[modFormal5Idx];
    const rSysSyn1 = table[modFormal5Idx + 1];
    const rSysSyn5 = table[modFormal5Idx + 2];

    if (rModSyn1?.[1] !== 'syntax@1' || rModFor1?.[1] !== 'formal@1' || rSysSyn1?.[1] !== 'syntax@1') {
      throw new Error('RealBench Verilog Table 2 metric labels shifted');
    }

    const rows: LeaderboardRow[] = [];
    modelHeaders.forEach((rawName, idx) => {
      const col = idx + 2;
      const modFormal = num(rModFor1[col]);
      if (!rawName || modFormal === undefined) return;

      const isVision = rawName === 'GPT-4o-V';
      const model = isVision ? 'GPT-4o' : rawName;
      const setting = isVision ? 'Vision input' : 'Text only';

      const modSyn1 = num(rModSyn1[col]);
      const modSyn5 = num(rModSyn5[col]);
      const modFun1 = num(rModFun1[col]);
      const modFun5 = num(rModFun5[col]);
      const modFor5 = num(rModFor5[col]);
      const sysSyn1 = num(rSysSyn1[col]);
      const sysSyn5 = num(rSysSyn5[col]);

      const hasAt5 = modSyn5 !== undefined;
      const metrics: Record<string, number> = {
        systemFormal: 0,
        systemFunction: 0,
      };
      if (hasAt5) {
        metrics.systemFormalAt5 = 0;
        metrics.systemFunctionAt5 = 0;
      }
      if (modSyn1 !== undefined) metrics.moduleSyntax = modSyn1;
      if (modSyn5 !== undefined) metrics.moduleSyntaxAt5 = modSyn5;
      if (modFun1 !== undefined) metrics.moduleFunction = modFun1;
      if (modFun5 !== undefined) metrics.moduleFunctionAt5 = modFun5;
      metrics.moduleFormal = modFormal;
      if (modFor5 !== undefined) metrics.moduleFormalAt5 = modFor5;
      if (sysSyn1 !== undefined) metrics.systemSyntax = sysSyn1;
      if (sysSyn5 !== undefined) metrics.systemSyntaxAt5 = sysSyn5;

      rows.push({
        model,
        setting,
        score: Number(((modFormal + 0) / 2).toFixed(2)),
        trials: hasAt5 ? 20 : 1,
        metrics,
      });
    });

    return checked(rows, 10);
  },
};

export default board;
