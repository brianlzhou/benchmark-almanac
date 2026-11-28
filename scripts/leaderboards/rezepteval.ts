import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://moeller-bonn.com/app/data/rezept-bench/leaderboard.json';

interface RawModel {
  id: string;
  display: string;
  n_recipes?: number;
  total_repairs?: number;
  cost_usd?: number;
  completion_tokens?: number;
  reasoning_tokens?: number;
  dims?: {
    schema?: number;
    constraints?: number;
    konsistenz?: number;
    plausibilitaet?: number;
  };
  safety_flags?: unknown[];
  judged_dims?: {
    praktikabilitaet?: number;
    geschmack?: number;
    kreativitaet?: number;
  };
  domain_scores?: {
    rezepte?: number;
    sicherheit?: number;
    theorie?: number;
    diagnose?: number;
    logistik?: number;
    chemie?: number;
  };
  headline_score?: number;
  n_hard_fail?: number;
}

interface Payload {
  generated_at?: string;
  models?: RawModel[];
}

const pct = (v: number | undefined): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 1000) / 10 : undefined;

const board: Leaderboard = {
  benchmark: 'rezepteval',
  url: 'https://moeller-bonn.com/app/rezept-bench/',
  feed: FEED,
  terms: 'Public JSON leaderboard published by Matteo Moeller with per-item results under CC BY 4.0.',
  costPer: 'run',
  chart: {
    title: 'Score vs. cost',
    x: { key: 'cost', label: 'Run cost', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Overall score', unit: 'score', better: 'higher' },
    note: 'Composite score across 78 German cooking tasks plotted against total OpenRouter run cost.',
  },
  parts: {
    recipes: { name: 'Recipes', group: 'Discipline' },
    foodSafety: { name: 'Food safety', group: 'Discipline' },
    cookingTheory: { name: 'Cooking theory', group: 'Discipline' },
    troubleshooting: { name: 'Troubleshooting', group: 'Discipline' },
    mealScheduling: { name: 'Meal scheduling', group: 'Discipline' },
    culinaryChemistry: { name: 'Culinary chemistry', group: 'Discipline' },
  },
  stats: {
    constraints: { name: 'Constraint adherence', unit: '%', better: 'higher' },
    consistency: { name: 'Ingredient consistency', unit: '%', better: 'higher' },
    plausibility: { name: 'Plausibility', unit: '%', better: 'higher' },
    schemaCompliance: { name: 'Schema compliance', unit: '%', better: 'higher' },
    practicality: { name: 'Panel practicality', unit: 'rating', better: 'higher', note: 'Judge panel rating on a 1 to 10 scale.' },
    flavor: { name: 'Panel flavor', unit: 'rating', better: 'higher', note: 'Judge panel rating on a 1 to 10 scale.' },
    creativity: { name: 'Panel creativity', unit: 'rating', better: 'higher', note: 'Judge panel rating on a 1 to 10 scale.' },
    completionTokensTotal: { name: 'Total completion tokens', unit: 'tokens' },
    reasoningTokensTotal: { name: 'Total reasoning tokens', unit: 'tokens' },
    hardFails: { name: 'Hard fails', unit: 'count', better: 'lower' },
    repairs: { name: 'Schema repairs', unit: 'count', better: 'lower' },
    safetyFlags: { name: 'Recipe safety flags', unit: 'count', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Payload;
    const runDate = data.generated_at?.slice(0, 10);
    const validDate = runDate && /^\d{4}-\d{2}-\d{2}$/.test(runDate) ? runDate : undefined;

    const rows: LeaderboardRow[] = [];
    for (const m of data.models ?? []) {
      const model = (m.display || m.id || '').trim();
      const score = m.headline_score;
      if (!model || typeof score !== 'number' || !Number.isFinite(score)) continue;

      const metrics: Record<string, number> = {};
      const d = m.domain_scores;
      if (typeof d?.rezepte === 'number') metrics.recipes = d.rezepte;
      if (typeof d?.sicherheit === 'number') metrics.foodSafety = d.sicherheit;
      if (typeof d?.theorie === 'number') metrics.cookingTheory = d.theorie;
      if (typeof d?.diagnose === 'number') metrics.troubleshooting = d.diagnose;
      if (typeof d?.logistik === 'number') metrics.mealScheduling = d.logistik;
      if (typeof d?.chemie === 'number') metrics.culinaryChemistry = d.chemie;

      const c = pct(m.dims?.constraints);
      if (c !== undefined) metrics.constraints = c;
      const k = pct(m.dims?.konsistenz);
      if (k !== undefined) metrics.consistency = k;
      const p = pct(m.dims?.plausibilitaet);
      if (p !== undefined) metrics.plausibility = p;
      const s = pct(m.dims?.schema);
      if (s !== undefined) metrics.schemaCompliance = s;

      if (typeof m.judged_dims?.praktikabilitaet === 'number') metrics.practicality = m.judged_dims.praktikabilitaet;
      if (typeof m.judged_dims?.geschmack === 'number') metrics.flavor = m.judged_dims.geschmack;
      if (typeof m.judged_dims?.kreativitaet === 'number') metrics.creativity = m.judged_dims.kreativitaet;

      if (typeof m.completion_tokens === 'number' && Number.isFinite(m.completion_tokens)) {
        metrics.completionTokensTotal = m.completion_tokens;
      }
      if (typeof m.reasoning_tokens === 'number' && Number.isFinite(m.reasoning_tokens)) {
        metrics.reasoningTokensTotal = m.reasoning_tokens;
      }
      if (typeof m.n_hard_fail === 'number' && Number.isFinite(m.n_hard_fail)) metrics.hardFails = m.n_hard_fail;
      if (typeof m.total_repairs === 'number' && Number.isFinite(m.total_repairs)) metrics.repairs = m.total_repairs;
      if (Array.isArray(m.safety_flags)) metrics.safetyFlags = m.safety_flags.length;

      const row: LeaderboardRow = { model, score, metrics };
      if (validDate) row.date = validDate;
      if (typeof m.cost_usd === 'number' && Number.isFinite(m.cost_usd) && m.cost_usd > 0) {
        row.cost = Math.round(m.cost_usd * 10000) / 10000;
      }
      if (
        typeof m.completion_tokens === 'number' &&
        typeof m.n_recipes === 'number' &&
        m.completion_tokens > 0 &&
        m.n_recipes > 0
      ) {
        row.tokens = Math.round(m.completion_tokens / m.n_recipes);
      }
      rows.push(row);
    }
    return rows;
  },
};

export default board;
