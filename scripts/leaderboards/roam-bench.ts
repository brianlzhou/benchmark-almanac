// ROAM-Bench — Embodied active spatial intelligence benchmark through evidence verification (arXiv:2611.33143).
// Parses the results array purely as data from https://rxjfighting.github.io/ROAM-Bench/assets/project.js,
// ranking seven current frontier VLMs by Task Success (T) across 250 embodied exploration tasks.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://rxjfighting.github.io/ROAM-Bench/';
const FEED = 'https://rxjfighting.github.io/ROAM-Bench/assets/project.js';

interface RoamEntry {
  model: string;
  tasks?: number;
  A?: number;
  T?: number;
  N?: number;
  S?: number;
  gap?: number;
  errorS?: number;
  actions?: number;
  human?: boolean;
}

function extractResultsArray(js: string): RoamEntry[] {
  const idx = js.indexOf('results:');
  if (idx < 0) throw new Error('ROAM-Bench results array not found');
  const arrStart = js.indexOf('[', idx);
  if (arrStart < 0) throw new Error('ROAM-Bench results opening bracket not found');
  let depth = 0;
  let inStr: string | null = null;
  let escaped = false;
  let arrEnd = -1;
  for (let i = arrStart; i < js.length; i++) {
    const ch = js[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") inStr = ch;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        arrEnd = i + 1;
        break;
      }
    }
  }
  if (arrEnd < 0) throw new Error('ROAM-Bench results array unterminated');
  const raw = js.slice(arrStart, arrEnd);
  const json = raw
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(json) as RoamEntry[];
}

const board: Leaderboard = {
  benchmark: 'roam-bench',
  url: SITE,
  feed: FEED,
  terms: 'Public project leaderboard published by the ROAM-Bench authors.',
  notModels: /^Human$/i,
  stats: {
    outcomeCorrectness: { name: 'Outcome correctness (A)', unit: '%', better: 'higher' },
    requiredChecks: { name: 'Required checks (N)', unit: '%', better: 'higher' },
    strongerChecks: { name: 'Stronger checks (S)', unit: '%', better: 'higher' },
    gapCases: { name: 'Gap cases', unit: 'count', better: 'lower', note: 'Correct outcomes with unmet task requirements.' },
    errorGivenS: { name: 'Error given stronger checks', unit: '%', better: 'lower' },
    avgActions: { name: 'Average actions', unit: 'count', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const js = await fetchText(FEED);
    const items = extractResultsArray(js);
    const rows: LeaderboardRow[] = [];
    for (const item of items) {
      if (item.human || !item.model || typeof item.T !== 'number' || !Number.isFinite(item.T)) continue;
      const metrics: Record<string, number> = {};
      if (typeof item.A === 'number') metrics.outcomeCorrectness = item.A;
      if (typeof item.N === 'number') metrics.requiredChecks = item.N;
      if (typeof item.S === 'number') metrics.strongerChecks = item.S;
      if (typeof item.gap === 'number') metrics.gapCases = item.gap;
      if (typeof item.errorS === 'number') metrics.errorGivenS = item.errorS;
      if (typeof item.actions === 'number') metrics.avgActions = item.actions;
      rows.push({
        model: item.model.trim(),
        score: item.T,
        metrics,
      });
    }
    if (rows.length < 5) throw new Error(`ROAM-Bench parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
