// GRAPE-Bench — Real-world and synthetic visual degradation video reasoning benchmark (arXiv:2611.33020).
// Parses the inline window.GRAPE JSON payload purely as data from https://zhangce01.github.io/grape-bench/,
// keeping all 30 proprietary and open-weight evaluated models (excluding fine-tuned paper ablations).

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://zhangce01.github.io/grape-bench/';

interface GrapeRealRow {
  m: string;
  size?: string;
  group?: string;
  cond?: Record<string, number[]>;
  all?: number[];
}

interface GrapeSynthRow {
  m: string;
  size?: string;
  all?: number;
  delta?: number;
}

interface GrapePayload {
  real?: GrapeRealRow[];
  synth?: GrapeSynthRow[];
}

function parseParamsBillions(size?: string): number | undefined {
  if (!size || size === '--') return undefined;
  const m = size.trim().match(/^(\d+(?:\.\d+)?)\s*([TB])$/i);
  if (!m) return undefined;
  const v = Number(m[1]);
  const b = m[2].toUpperCase() === 'T' ? v * 1000 : v;
  return b > 0 ? b : undefined;
}

function formatModelName(name: string, size?: string, group?: string): string {
  const clean = name.trim();
  if (!size || size === '--' || group === 'proprietary') return clean;
  if (clean.toLowerCase().includes(size.toLowerCase())) return clean;
  if (/^\d+(?:\.\d+)?T$/i.test(size.trim())) return clean;
  return `${clean}-${size.trim()}`;
}

const board: Leaderboard = {
  benchmark: 'grape-bench',
  url: FEED,
  feed: FEED,
  terms: 'Public project leaderboard published by the GRAPE-Bench authors.',
  parts: {
    l1: { name: 'Level 1', group: 'Reasoning level' },
    l2: { name: 'Level 2', group: 'Reasoning level' },
    l3: { name: 'Level 3', group: 'Reasoning level' },
    rain: { name: 'Rain', group: 'Condition' },
    snow: { name: 'Snow', group: 'Condition' },
    night: { name: 'Night', group: 'Condition' },
    fog: { name: 'Fog', group: 'Condition' },
  },
  stats: {
    synthAll: { name: 'Synthetic degraded accuracy', unit: '%', better: 'higher' },
    synthDelta: { name: 'Synthetic degradation delta', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const marker = 'window.GRAPE = ';
    const start = html.indexOf(marker);
    if (start < 0) throw new Error('GRAPE-Bench window.GRAPE payload not found');
    const jsonStart = start + marker.length;
    const jsonEnd = html.indexOf(';</script>', jsonStart);
    if (jsonEnd < 0) throw new Error('GRAPE-Bench window.GRAPE end tag not found');
    const data = JSON.parse(html.slice(jsonStart, jsonEnd)) as GrapePayload;

    const synthByKey = new Map<string, GrapeSynthRow>();
    for (const s of data.synth ?? []) {
      synthByKey.set(`${s.m}|${s.size ?? ''}`, s);
    }

    const rows: LeaderboardRow[] = [];
    for (const r of data.real ?? []) {
      if (r.group === 'tuned') continue;
      if (!r.m || !Array.isArray(r.all) || r.all.length < 4 || !Number.isFinite(r.all[3])) continue;
      const model = formatModelName(r.m, r.size, r.group);
      const metrics: Record<string, number> = {
        l1: r.all[0],
        l2: r.all[1],
        l3: r.all[2],
      };
      const conds: [string, string][] = [
        ['Rain', 'rain'],
        ['Snow', 'snow'],
        ['Night', 'night'],
        ['Fog', 'fog'],
      ];
      for (const [src, dst] of conds) {
        const arr = r.cond?.[src];
        if (Array.isArray(arr) && arr.length >= 4 && Number.isFinite(arr[3])) {
          metrics[dst] = arr[3];
        }
      }
      const synth = synthByKey.get(`${r.m}|${r.size ?? ''}`);
      if (synth && typeof synth.all === 'number' && Number.isFinite(synth.all)) {
        metrics.synthAll = synth.all;
      }
      if (synth && typeof synth.delta === 'number' && Number.isFinite(synth.delta)) {
        metrics.synthDelta = synth.delta;
      }

      const row: LeaderboardRow = {
        model,
        score: r.all[3],
        metrics,
      };
      if (r.group === 'open') row.open = true;
      else if (r.group === 'proprietary') row.open = false;
      const params = parseParamsBillions(r.size);
      if (params !== undefined) row.params = params;
      rows.push(row);
    }

    if (rows.length < 20) throw new Error(`GRAPE-Bench parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
