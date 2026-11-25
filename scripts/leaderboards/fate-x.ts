// FATE-X tests formal Lean proofs on 100 advanced algebra problems. Table 1 reports pass@64 with a 64k token limit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2511.02872';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}
function normModel(name: string): string {
  return name.trim().toLowerCase().replace(/-(?:\d+b(?:-a\d+b)?(?:-thinking)?)$/, '');
}

const board: Leaderboard = {
  benchmark: 'fate-x', static: 'paper',
  url: 'https://arxiv.org/abs/2511.02872',
  feed: FEED,
  terms: PAPER_TERMS,
  stats: {
    nlAccuracy: { name: 'Natural language proof accuracy', unit: '%', better: 'higher', note: 'Pass@1 natural language proof accuracy on FATE-X from Table 2.' },
  },
  async fetch() {
    const html = (await paperHtml(FEED)).replace(/<span[^>]*class="[^"]*ltx_phantom[^"]*"[^>]*>(?:<span[^>]*>[^<]*<\/span>|[^<])*<\/span>/gi, '');
    const tables = inlinePaperTables(html);
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "FATE-M" && t[0]?.[2] === "FATE-H" && t[0]?.[3] === "FATE-X" && t.length >= 10);
    if (!table) throw new Error("Missing fate-x results table");

    const nlByModel = new Map<string, number>();
    const nlTable = tables.find(t => t[0]?.includes('FATE-X') && t[1]?.includes('NL') && t[1]?.includes('FL'));
    if (nlTable) {
      const col = nlTable[0].findIndex((h, i) => h === 'FATE-X' && nlTable[1]?.[i] === 'NL');
      if (col >= 0) {
        for (const cells of nlTable.slice(2)) {
          if (cells.every(c => c === cells[0])) continue;
          const v = cells[col]?.trim().replace(/%$/, '');
          if (/^\d+(?:\.\d+)?$/.test(v)) nlByModel.set(normModel(cells[0]), Number(v));
        }
      }
    }

    const tokensByModel = new Map<string, number>();
    const tokTable = tables.find(t => t !== table && t[0]?.[0] === 'Model' && t[0]?.[3] === 'FATE-X' && t.length >= 4 && t.length <= 7);
    if (tokTable) {
      for (const cells of tokTable.slice(1)) {
        const v = cells[3]?.trim();
        if (/^\d+(?:\.\d+)?$/.test(v)) tokensByModel.set(normModel(cells[0]), Number(v));
      }
    }

    const paramsByModel = new Map<string, number>();
    const sizeTable = tables.find(t => t[0]?.[0] === 'Model' && t[0]?.[1] === 'Size' && t[0]?.[2] === 'Avg. Length');
    if (sizeTable) {
      for (const cells of sizeTable.slice(1)) {
        const m = cells[1]?.match(/^(\d+(?:\.\d+)?)B$/i);
        if (m) paramsByModel.set(normModel(cells[0]), Number(m[1]));
      }
    }

    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      if (cells.every(c => c === cells[0])) continue;
      const model = cells[0];
      const score = number(cells[3]);
      const key = normModel(model);
      const nl = nlByModel.get(key);
      const tokens = tokensByModel.get(key);
      const params = paramsByModel.get(key);
      rows.push({
        model, score, trials: 64, setting: 'pass@64, max 64k tokens',
        ...(tokens !== undefined ? { tokens } : {}),
        ...(params !== undefined ? { params } : {}),
        ...(nl !== undefined ? { metrics: { nlAccuracy: nl } } : {}),
      });
    }
    if (rows.length < 8) throw new Error("Incomplete fate-x comparison");
    return rows;
  },
};
export default board;
