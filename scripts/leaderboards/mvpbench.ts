// MVPBench (Minimal Video Pairs, arXiv:2506.09987) tests video understanding using pairs of near-identical
// videos with opposite answers. Table 4 reports Minimal Pair Score accuracy on full MVP and on MVP-mini in
// parentheses, evaluating closed-source models only on MVP-mini. This static paper importer uses MVP-mini
// macro-average as the headline score so all evaluated models are included, keeping all four MVP-mini
// categories plus full MVP macro-average and its four categories in parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2506.09987';

const parts: Record<string, BoardPart> = {
  miniHumanObject: { name: 'Human-object interactions (mini)', group: 'MVP-mini', unit: '%' },
  miniRobotObject: { name: 'Robot-object interactions (mini)', group: 'MVP-mini', unit: '%' },
  miniIntuitivePhysics: { name: 'Intuitive physics and collisions (mini)', group: 'MVP-mini', unit: '%' },
  miniTemporal: { name: 'Coarse-grained temporal reasoning (mini)', group: 'MVP-mini', unit: '%' },
  fullMacroAvg: { name: 'Full MVP macro-average', group: 'Full MVP', unit: '%' },
  fullHumanObject: { name: 'Human-object interactions (full)', group: 'Full MVP', unit: '%' },
  fullRobotObject: { name: 'Robot-object interactions (full)', group: 'Full MVP', unit: '%' },
  fullIntuitivePhysics: { name: 'Intuitive physics and collisions (full)', group: 'Full MVP', unit: '%' },
  fullTemporal: { name: 'Coarse-grained temporal reasoning (full)', group: 'Full MVP', unit: '%' },
};

function parsePair(cell: string): { full?: number; mini?: number } {
  const m = cell.trim().match(/^([0-9.]+|[–—-])(?:\s*\(\s*([0-9.]+)\s*\))?$/);
  if (!m) return {};
  const full = /^[0-9.]+$/.test(m[1]) ? Number(m[1]) : undefined;
  const mini = m[2] ? Number(m[2]) : undefined;
  return {
    full: full !== undefined && Number.isFinite(full) ? full : undefined,
    mini: mini !== undefined && Number.isFinite(mini) ? mini : undefined,
  };
}

const board: Leaderboard = {
  benchmark: 'mvpbench',
  url: 'https://arxiv.org/abs/2506.09987',
  feed: `${FEED} (Table 4)`,
  static: 'paper',
  terms: 'arXiv permits automated reading of HTML papers under robots.txt. Paper tables are attributed to their authors. https://arxiv.org/abs/2506.09987',
  headline: 'Closed-source models in Table 4 are evaluated only on MVP-mini, so this uses the MVP-mini macro-average, with full MVP scores and all four category breakdowns kept in parts.',
  notModels: /^(?:Random|Any text model|Human)\b/i,
  aliases: {
    'LLaVA-OV (Qwen2-7B)': 'llava-onevision-7b',
    'Qwen2-VL (7B)': 'qwen2-vl-7b-instruct',
    'Mini-CPM-v 2.6': 'minicpm-v-2-6',
    'InternVL2.5-8B': 'internvl2-5-8b',
  },
  parts,
  async fetch() {
    const html = await paperHtml(FEED);
    const tbl = paperTables(html)
      .map(grid)
      .find((t) => t[0]?.some((c) => /MVP\s*\(macro-avg\)/i.test(c)) && t.some((r) => /InternVL2\.5-8B/i.test(r[0] ?? '')));
    if (!tbl) throw new Error('MVPBench Table 4 missing from arXiv HTML');

    const rows: LeaderboardRow[] = [];
    let setting: string | undefined;
    for (const r of tbl.slice(1)) {
      const label = (r[0] ?? '').replace(/[†*]/g, '').trim();
      if (!label) continue;
      if (/^Single-Frame Baseline/i.test(label)) {
        setting = 'single-frame';
        continue;
      }
      if (/^VideoLLMs/i.test(label)) {
        setting = 'full video';
        continue;
      }
      if (r.length < 6) continue;
      const overall = parsePair(r[1]);
      if (overall.mini === undefined) continue;

      let model = label;
      if (/^Gemini-1\.5 Pro$/i.test(model)) model = 'Gemini-1.5 Pro (snapshot unspecified)';
      else if (/^GPT4-o$/i.test(model)) model = 'GPT-4o (snapshot unspecified)';

      const c1 = parsePair(r[2]);
      const c2 = parsePair(r[3]);
      const c3 = parsePair(r[4]);
      const c4 = parsePair(r[5]);
      const metrics: Record<string, number> = {};
      if (c1.mini !== undefined) metrics.miniHumanObject = c1.mini;
      if (c2.mini !== undefined) metrics.miniRobotObject = c2.mini;
      if (c3.mini !== undefined) metrics.miniIntuitivePhysics = c3.mini;
      if (c4.mini !== undefined) metrics.miniTemporal = c4.mini;
      if (overall.full !== undefined) metrics.fullMacroAvg = overall.full;
      if (c1.full !== undefined) metrics.fullHumanObject = c1.full;
      if (c2.full !== undefined) metrics.fullRobotObject = c2.full;
      if (c3.full !== undefined) metrics.fullIntuitivePhysics = c3.full;
      if (c4.full !== undefined) metrics.fullTemporal = c4.full;

      rows.push({
        model,
        score: overall.mini,
        setting: /^(?:Random|Any text model|Human)$/i.test(model) ? undefined : setting,
        metrics,
      });
    }
    return checked(rows, 13);
  },
};

export default board;
