// ACEBench (tool use) on chenchen0103.github.io/ACEBench. The page builds its table from script.js, which
// defines three arrays of model results: allCombinedModels (the default view), allChineseModels and
// allEnglishModels. The combined array is read here, as data with jsLiteral (never run), and its "overall"
// (0 to 100) is the score. Rows carry no dates, so they take the paper's (arXiv 2501.12851, January 2025)
// and the resolver picks the snapshots current then. Later additions name their snapshot ("Kimi-k2-0711").
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = 'https://chenchen0103.github.io/ACEBench/script.js';
const MARK = 'const allCombinedModels =';
const PAPER_DATE = '2025-01-21';

const PART_KEYS = ['atom', 'single', 'multi', 'api', 'pref', 'summary', 'special', 'agent'] as const;

const board: Leaderboard = {
  benchmark: 'acebench',
  parts: {
    atom: { name: 'Atom', group: 'Normal' },
    single: { name: 'Single-Turn', group: 'Normal' },
    multi: { name: 'Multi-Turn', group: 'Normal' },
    api: { name: 'Similar API', group: 'Normal' },
    pref: { name: 'Preference', group: 'Normal' },
    summary: { name: 'Normal summary', group: 'Normal' },
    special: { name: 'Special', group: 'Category' },
    agent: { name: 'Agent', group: 'Category' },
  },
  url: 'https://chenchen0103.github.io/ACEBench/',
  feed: `${FEED} (allCombinedModels)`,
  terms: 'Static script on a GitHub Pages project site with no robots.txt and no terms; the ACEBench repository is public and the scores are cited to the authors.',
  aliases: {
    'Gemini-2.5-Pro-05-06': 'gemini-2-5-pro-may-2025',
    'Kimi-k2-0711': 'kimi-k2-jul-2025',
    'Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Qwen2.5-Coder-7B-Instruct': 'qwen2-5-coder-7b',
    'Llama-3.2-3B-Instruct': 'llama-3-2-3b',
  },
  async fetch() {
    const js = await fetchText(FEED);
    const at = js.indexOf(MARK);
    if (at < 0) throw new Error('allCombinedModels not found');
    const list = jsLiteral<({ model?: string; category?: string; overall?: number } & Partial<Record<(typeof PART_KEYS)[number], number>>)[]>(js, js.indexOf('[', at));
    const rows: LeaderboardRow[] = [];
    for (const m of list) {
      if (!m.model || typeof m.overall !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const k of PART_KEYS) {
        const v = m[k];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      const open = m.category === 'open' ? true : m.category === 'closed' ? false : undefined;
      rows.push({
        model: m.model.trim(),
        score: m.overall,
        date: PAPER_DATE,
        open,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    if (!rows.length) throw new Error('no rows in allCombinedModels');
    return rows;
  },
};
export default board;
