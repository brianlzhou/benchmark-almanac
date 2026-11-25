// AI Professions Prompt Benchmark, from the makers' per-prompt scores (data/results.csv in their GitHub repository,
// CC BY 4.0). A model's score is the share of the 5 pass or fail criteria it met, over all 100 prompts and their 3
// runs. The makers grade GPT-6 Astra with a different judge (Claude Opus 5.5) from every other model (GPT-6 Astra),
// and say their results are not one ranking, so only the models that share the main judge are read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/aiprofessions/prompt-benchmark/main/data/results.csv';
const JUDGE = 'gpt-6-astra';

const PROFESSIONS: Record<string, [string, string]> = {
  accountants: ['accountants', 'Accountants'],
  'construction-managers': ['constructionManagers', 'Construction managers'],
  engineers: ['engineers', 'Engineers'],
  'event-planners': ['eventPlanners', 'Event planners'],
  healthcare: ['healthcare', 'Healthcare'],
  'interior-designers': ['interiorDesigners', 'Interior designers'],
  lawyers: ['lawyers', 'Lawyers'],
  any: ['general', 'General'],
  'real-estate-agents': ['realEstateAgents', 'Real estate agents'],
  'sales-managers': ['salesManagers', 'Sales managers'],
  'travel-agents': ['travelAgents', 'Travel agents'],
};
const LANGS: Record<string, [string, string]> = {
  en: ['en', 'English'],
  es: ['es', 'Spanish'],
  fr: ['fr', 'French'],
  pt: ['pt', 'Portuguese'],
};

const board: Leaderboard = {
  benchmark: 'ai-professions-prompt-benchmark',
  parts: {
    ...Object.fromEntries(Object.values(PROFESSIONS).map(([k, name]) => [k, { name, group: 'Profession' }])),
    ...Object.fromEntries(Object.values(LANGS).map(([k, name]) => [k, { name, group: 'Language' }])),
  },
  stats: {
    allCriteriaRate: { name: 'All-criteria pass rate', unit: '%', better: 'higher' },
  },
  url: 'https://aiprofessions.ai/models/ai-model-test-results/',
  feed: `${FEED} (per-prompt scores)`,
  terms: 'Per-prompt scores the makers publish in their GitHub repository under CC BY 4.0.',
  aliases: { 'gemini-4-argon-medium': 'gemini-4-argon' },
  async fetch() {
    const by = new Map<string, { passed: number; total: number; date: string; runs: number; allCrit: number; graded: number; buckets: Map<string, { p: number; t: number }> }>();
    for (const r of parseCsv(await fetchText(FEED))) {
      if (r.judge !== JUDGE || !(Number(r.runs_graded) > 0)) continue;
      const e = by.get(r.model_id) ?? { passed: 0, total: 0, date: '', runs: 0, allCrit: 0, graded: 0, buckets: new Map() };
      const p = Number(r.criteria_passed_avg);
      const t = Number(r.criteria_total);
      e.passed += p;
      e.total += t;
      e.allCrit += Number(r.runs_all_criteria) || 0;
      e.graded += Number(r.runs_graded) || 0;
      if (r.test_date > e.date) e.date = r.test_date;
      e.runs = Math.max(e.runs, Number(r.runs_graded));
      const profKey = PROFESSIONS[r.profession]?.[0];
      if (profKey) {
        const b = e.buckets.get(profKey) ?? { p: 0, t: 0 };
        b.p += p;
        b.t += t;
        e.buckets.set(profKey, b);
      }
      const langKey = LANGS[r.lang]?.[0];
      if (langKey) {
        const b = e.buckets.get(langKey) ?? { p: 0, t: 0 };
        b.p += p;
        b.t += t;
        e.buckets.set(langKey, b);
      }
      by.set(r.model_id, e);
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, e] of by) {
      if (!(e.total > 0)) continue;
      const metrics: Record<string, number> = {};
      for (const [k, b] of e.buckets) {
        if (b.t > 0) metrics[k] = Number(((100 * b.p) / b.t).toFixed(2));
      }
      if (e.graded > 0) metrics.allCriteriaRate = Number(((100 * e.allCrit) / e.graded).toFixed(2));
      rows.push({
        model,
        score: (100 * e.passed) / e.total,
        date: e.date,
        trials: e.runs,
        ...(model.endsWith('-medium') ? { setting: 'medium' } : {}),
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
