// T2I-NSI negation awareness benchmark from arXiv:2611.09304 HTML Tables 3, 4, 5, and 6.
// Covers both the open-weights tier (Basic CLIP and Robust 3-probe) and the closed-source extension
// (excluding Midjourney v7 which only ran the 228-prompt syntax subset).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2611.09304';

function num(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/\\?%/g, '').replace(/\{,\}|,/g, '').trim();
  if (!cleaned || cleaned === '—' || cleaned === '-') return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

const board: Leaderboard = {
  benchmark: 't2i-nsi',
  static: 'paper',
  url: FEED,
  feed: FEED,
  terms: 'The authors publish these tables under the license on the arXiv record. https://arxiv.org/abs/2611.09304',
  aliases: {
    'FLUX.2': 'flux-2-klein-9b',
    'Gemini-2.5-Flash-Image': 'gemini-2-5-flash-image-preview-nano-banana',
    'GPT-Image-1.5': 'gpt-image-1-5',
  },
  parts: {
    'lex.': { name: 'Lexical negation', group: 'Form' },
    'morph.': { name: 'Morphological negation', group: 'Form' },
    'syn.': { name: 'Syntactic negation', group: 'Form' },
    'L0 (obj)': { name: 'L0 (object)', group: 'Complexity level' },
    'L1 (attr)': { name: 'L1 (attribute)', group: 'Complexity level' },
    'L2 (rel)': { name: 'L2 (relation)', group: 'Complexity level' },
    'L3 (comp)': { name: 'L3 (composition)', group: 'Complexity level' },
    'L4 (nest)': { name: 'L4 (nested)', group: 'Complexity level' },
  },
  stats: {
    'Mean C_{j}': { name: 'Mean consistency', unit: 'score', better: 'higher' },
    NegAlign: { name: 'Negative alignment', unit: 'score', better: 'higher' },
    Weight: { name: 'Weight', unit: 'score' },
    Similarity: { name: 'Similarity', unit: 'score', better: 'higher' },
    Uncertainty: { name: 'Uncertainty', unit: 'score', better: 'lower' },
    SUCCESS: { name: 'Successful generations', unit: '%', better: 'higher' },
    ALWAYS_PRESENT: { name: 'Always-present failures', unit: '%', better: 'lower' },
    ALWAYS_ABSENT: { name: 'Always-absent failures', unit: '%', better: 'lower' },
    PARTIAL_SUPPR: { name: 'Partial suppression failures', unit: '%', better: 'lower' },
    WEAKLY_REND: { name: 'Weakly rendered failures', unit: '%', better: 'lower' },
    atoms: { name: 'Prompt atoms evaluated', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const tOpen = tables.find((t) => t[0]?.[0] === 'Algorithm' && t[0]?.[2]?.includes('NSI'));
    const tFail = tables.find((t) => t[0]?.[0] === 'Model' && t[0]?.[1] === 'SUCCESS');
    const tParts = tables.find((t) => t[0]?.[0] === 'Model' && t[1]?.[1] === 'lex.');
    const tClosed = tables.find((t) => t[0]?.[0] === 'Model' && t[0]?.[1] === 'N' && t[0]?.[2]?.includes('NSI'));
    if (!tOpen || !tFail || !tParts || !tClosed) {
      throw new Error('Expected T2I-NSI paper tables (open, failure modes, parts, closed) missing');
    }

    const failByModel = new Map<string, Record<string, number>>();
    for (const r of tFail.slice(1)) {
      const m: Record<string, number> = {};
      const cols: [string, number][] = [
        ['SUCCESS', 1],
        ['ALWAYS_PRESENT', 2],
        ['ALWAYS_ABSENT', 3],
        ['PARTIAL_SUPPR', 5],
        ['WEAKLY_REND', 6],
      ];
      for (const [k, idx] of cols) {
        const v = num(r[idx]);
        if (v !== undefined) m[k] = v;
      }
      if (r[0]) failByModel.set(r[0].trim(), m);
    }

    const partsByModel = new Map<string, Record<string, number>>();
    const partKeys = ['lex.', 'morph.', 'syn.', 'L0 (obj)', 'L1 (attr)', 'L2 (rel)', 'L3 (comp)', 'L4 (nest)'];
    for (const r of tParts.slice(2)) {
      const m: Record<string, number> = {};
      partKeys.forEach((k, i) => {
        const v = num(r[i + 1]);
        if (v !== undefined) m[k] = v;
      });
      if (r[0]) partsByModel.set(r[0].trim(), m);
    }

    const rows: LeaderboardRow[] = [];
    for (const r of tOpen.slice(1)) {
      const algo = r[0]?.trim();
      const model = r[1]?.trim();
      const score = num(r[2]);
      if (!algo || !model || score === undefined) continue;

      const metrics: Record<string, number> = {};
      const mc = num(r[3]);
      const na = num(r[4]);
      const wt = num(r[5]);
      const sim = num(r[6]);
      const unc = num(r[7]);
      if (mc !== undefined) metrics['Mean C_{j}'] = mc;
      if (na !== undefined) metrics.NegAlign = na;
      if (wt !== undefined) metrics.Weight = wt;
      if (sim !== undefined) metrics.Similarity = sim;
      if (unc !== undefined) metrics.Uncertainty = unc;

      if (algo.startsWith('Robust')) {
        Object.assign(metrics, partsByModel.get(model) ?? {}, failByModel.get(model) ?? {});
      }

      rows.push({
        model,
        setting: `${algo}, open-weights tier`,
        score,
        open: true,
        metrics,
      });
    }

    for (const r of tClosed.slice(1)) {
      const model = r[0]?.trim();
      if (!model || /syn\.\s*only/i.test(model)) continue;
      const score = num(r[2]);
      if (score === undefined) continue;

      const metrics: Record<string, number> = {};
      const atoms = num(r[1]);
      const na = num(r[3]);
      const suc = num(r[4]);
      const ap = num(r[5]);
      const aa = num(r[6]);
      const ps = num(r[8]);
      const wr = num(r[9]);
      if (atoms !== undefined) metrics.atoms = atoms;
      if (na !== undefined) metrics.NegAlign = na;
      if (suc !== undefined) metrics.SUCCESS = suc;
      if (ap !== undefined) metrics.ALWAYS_PRESENT = ap;
      if (aa !== undefined) metrics.ALWAYS_ABSENT = aa;
      if (ps !== undefined) metrics.PARTIAL_SUPPR = ps;
      if (wr !== undefined) metrics.WEAKLY_REND = wr;

      rows.push({
        model,
        setting: 'Robust (3-probe), closed-source extension',
        score,
        open: false,
        metrics,
      });
    }

    return checked(rows, 8);
  },
};

export default board;
