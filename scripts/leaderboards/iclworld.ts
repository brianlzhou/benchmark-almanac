import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://iclworld.github.io/assets/js/data.js';

interface IclModel {
  id: string;
  name: string;
  agent: string;
}

interface MainEntry {
  overall: [number, number];
  cua: { avg: [number, number]; easy: [number, number]; medium: [number, number]; hard: [number, number] };
  rua: { avg: [number, number]; easy: [number, number]; medium: [number, number]; hard: [number, number] };
}

function parseObjectLiteral<T>(src: string): T {
  const jsonish = src
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(jsonish) as T;
}

const GEN_KEYS = [
  'cuaReplay',
  'cuaResample13',
  'cuaResample37',
  'cuaRelocate',
  'ruaReplay',
  'ruaResample',
  'ruaRelocate',
] as const;

const board: Leaderboard = {
  benchmark: 'iclworld',
  url: 'https://iclworld.github.io/#leaderboard',
  feed: FEED,
  terms: 'Public project leaderboard script published on iclworld.github.io.',
  static: 'paper',
  harnesses: 'system',
  parts: {
    cua: { name: 'Computer use', group: 'Domain' },
    rua: { name: 'Robot use', group: 'Domain' },
    cuaEasy: { name: 'Computer use easy', group: 'Computer use difficulty' },
    cuaMedium: { name: 'Computer use medium', group: 'Computer use difficulty' },
    cuaHard: { name: 'Computer use hard', group: 'Computer use difficulty' },
    ruaEasy: { name: 'Robot use easy', group: 'Robot use difficulty' },
    ruaMedium: { name: 'Robot use medium', group: 'Robot use difficulty' },
    ruaHard: { name: 'Robot use hard', group: 'Robot use difficulty' },
    cuaReplay: { name: 'Computer use replay (n=13)', group: 'Generalization' },
    cuaResample13: { name: 'Computer use resample (n=13)', group: 'Generalization' },
    cuaResample37: { name: 'Computer use resample (n=37)', group: 'Generalization' },
    cuaRelocate: { name: 'Computer use relocate (n=37)', group: 'Generalization' },
    ruaReplay: { name: 'Robot use replay (n=14)', group: 'Generalization' },
    ruaResample: { name: 'Robot use resample (n=15)', group: 'Generalization' },
    ruaRelocate: { name: 'Robot use relocate (n=17)', group: 'Generalization' },
  },
  stats: {
    cuaRuaGap: {
      name: 'Computer minus robot gap',
      unit: '%',
      note: 'Computer-use average minus robot-use average in percentage points.',
    },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const js = await res.text();
    const start = js.indexOf('{');
    const end = js.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('Could not locate ICLWORLD_DATA object');
    const data = parseObjectLiteral<{
      models: IclModel[];
      main: Record<string, MainEntry>;
      generalization?: { rows?: Record<string, [number, number][]> };
    }>(js.slice(start, end + 1));

    const rows: LeaderboardRow[] = [];
    const modes: [number, string][] = [
      [0, 'Text context'],
      [1, 'Video context'],
    ];
    for (const m of data.models ?? []) {
      const entry = data.main?.[m.id];
      if (!entry) continue;
      const gen = data.generalization?.rows?.[m.id];
      for (const [mod, setting] of modes) {
        const score = entry.overall[mod];
        if (typeof score !== 'number' || !Number.isFinite(score)) continue;
        const cua = entry.cua.avg[mod];
        const rua = entry.rua.avg[mod];
        const metrics: Record<string, number> = {
          cua,
          rua,
          cuaEasy: entry.cua.easy[mod],
          cuaMedium: entry.cua.medium[mod],
          cuaHard: entry.cua.hard[mod],
          ruaEasy: entry.rua.easy[mod],
          ruaMedium: entry.rua.medium[mod],
          ruaHard: entry.rua.hard[mod],
          cuaRuaGap: Math.round((cua - rua) * 10) / 10,
        };
        if (gen) {
          for (let i = 0; i < GEN_KEYS.length; i++) {
            const v = gen[i]?.[mod];
            if (typeof v === 'number' && Number.isFinite(v)) metrics[GEN_KEYS[i]] = v;
          }
        }
        rows.push({
          model: m.name,
          score,
          setting,
          harness: m.agent || undefined,
          metrics,
        });
      }
    }
    return rows;
  },
};

export default board;
