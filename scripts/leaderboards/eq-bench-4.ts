// EQ-Bench 4 on eqbench.com. The leaderboard page loads eqbench4/eqbench4_data.js, a generated script that
// assigns one JSON object, EQBENCH4_DATA: per model an Elo rating (fitted from a three-judge pairwise
// panel over 120 roleplay scenarios) with its 95% interval, rank, trait dimensions and ability scores.
// Elo is the ranking and the score. The object is read as data (JSON after the assignment), never run.
// EQ-Bench 3 now sits on the legacy boards and is not read here. The Elo's 95% interval (ci_low, ci_high)
// is kept as metrics.ciLow and ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = 'https://eqbench.com/eqbench4/eqbench4_data.js';

interface Model {
  model: string;
  display?: string;
  elo?: number;
  ci_low?: number;
  ci_high?: number;
  sigma?: number;
  n_scenarios?: number;
  rank?: number;
  transcript_dir?: string;
  dims?: Record<string, number>;
  ability_modes?: { absolute?: { elos?: Record<string, number> } };
}

const ABILITIES: Record<string, string> = {
  bond_and_rapport: 'Bond and rapport',
  authenticity: 'Authenticity',
  attunement: 'Attunement',
  meeting_prefs_and_needs: 'Meeting preferences and needs',
  emotion_sensemaking: 'Emotion sensemaking',
  emotion_management: 'Emotion management',
};

const DIMS: Record<string, string> = {
  analytical: 'Analytical',
  validation_propensity: 'Validating',
  challenge_propensity: 'Challenging',
  interpretive_boldness: 'Interpretive boldness',
  directive_advice_orientation: 'Directive advice',
  escalation_containment: 'Escalation containment',
  yielding: 'Yielding',
  naturalness_authenticity: 'Naturalness',
};

const board: Leaderboard = {
  benchmark: 'eq-bench-4',
  url: 'https://eqbench.com/',
  feed: FEED,
  terms: 'Generated data file on the eqbench.com GitHub Pages site, which states no terms or license for the scores.',
  parts: Object.fromEntries(Object.entries(ABILITIES).map(([k, name]) => [k, { name, group: 'Ability', unit: 'elo' as const }])),
  stats: Object.fromEntries(Object.entries(DIMS).map(([k, name]) => [k, { name, unit: 'score' as const }])),
  aliases: {},
  async fetch() {
    const data = jsonAfter<{ models: Model[] }>(await fetchText(FEED), 'const EQBENCH4_DATA =');
    const rows: LeaderboardRow[] = [];
    for (const m of data.models) {
      if (typeof m.elo !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof m.ci_low === 'number' && typeof m.ci_high === 'number') {
        metrics.ciLow = m.ci_low;
        metrics.ciHigh = m.ci_high;
      }
      if (typeof m.sigma === 'number') metrics.stderr = m.sigma;
      for (const k of Object.keys(ABILITIES)) {
        const v = m.ability_modes?.absolute?.elos?.[k];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = Number(v.toFixed(1));
      }
      for (const k of Object.keys(DIMS)) {
        const v = m.dims?.[k];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      const ci = typeof m.ci_low === 'number' && typeof m.ci_high === 'number' ? { low: m.ci_low, high: m.ci_high } : {};
      rows.push({
        model: m.model.trim(),
        score: m.elo,
        trials: typeof m.n_scenarios === 'number' ? m.n_scenarios : undefined,
        link: m.transcript_dir?.startsWith('transcripts/') ? new URL(m.transcript_dir + '/', FEED).href : undefined,
        ...ci,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (!rows.length) throw new Error('no models in EQBENCH4_DATA');
    return rows;
  },
};
export default board;
