// RoboTrack-Bench (Allen Institute for AI): 2D point tracking and occlusion accuracy on 307 manipulation clips.
// Reads both uniform-protocol evaluation tables (overall AJ/<delta_avg/OA and per-source AJ) from allenai/robotrack README.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://github.com/allenai/robotrack';
const FEED = 'https://raw.githubusercontent.com/allenai/robotrack/main/README.md';

const stripFmt = (s: string) =>
  s
    .replace(/<\/?u>/gi, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();

function parseMdTable(md: string, headerStart: string): string[][] {
  const idx = md.indexOf(headerStart);
  if (idx === -1) throw new Error(`RoboTrack-Bench: table header not found (${headerStart})`);
  const lines = md.slice(idx).split('\n');
  const out: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    const cells = line
      .slice(1, line.endsWith('|') ? -1 : undefined)
      .split('|')
      .map((c) => stripFmt(c));
    out.push(cells);
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'robotrack-bench',
  url: PAGE,
  feed: FEED,
  terms: 'Public Apache-2.0 repository and evaluation tables published by the Allen Institute for AI.',
  static: 'paper',
  parts: {
    droidFranka: { name: 'DROID Franka', group: 'Source' },
    molmoact2Yam: { name: 'MolmoAct2 YAM', group: 'Source' },
    molmoact2So100: { name: 'MolmoAct2 SO-100', group: 'Source' },
    egoverseEva: { name: 'EgoVerse EVA', group: 'Source' },
    egoverseHuman: { name: 'EgoVerse human', group: 'Source' },
    egoExo4dHuman: { name: 'Ego-Exo4D human', group: 'Source' },
  },
  stats: {
    deltaAvg: { name: 'Position accuracy (<δavg)', unit: '%', better: 'higher' },
    oa: { name: 'Occlusion accuracy', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`RoboTrack-Bench README: ${res.status}`);
    const md = await res.text();

    const mainRows = parseMdTable(md, '| Model | Training data | AJ |');
    const sourceRows = parseMdTable(md, '| Model | Training data | DROID Franka');

    const bySourceKey = new Map<string, Record<string, number>>();
    for (const c of sourceRows) {
      if (c.length < 8) continue;
      const key = `${c[0]}||${c[1]}`;
      bySourceKey.set(key, {
        droidFranka: Number(c[2]),
        molmoact2Yam: Number(c[3]),
        molmoact2So100: Number(c[4]),
        egoverseEva: Number(c[5]),
        egoverseHuman: Number(c[6]),
        egoExo4dHuman: Number(c[7]),
      });
    }

    const rows: LeaderboardRow[] = [];
    for (const c of mainRows) {
      if (c.length < 5) continue;
      const [model, trainingData, ajStr, deltaStr, oaStr] = c;
      const score = Number(ajStr);
      if (!model || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      if (Number.isFinite(Number(deltaStr))) metrics.deltaAvg = Number(deltaStr);
      if (Number.isFinite(Number(oaStr))) metrics.oa = Number(oaStr);
      const src = bySourceKey.get(`${model}||${trainingData}`);
      if (src) {
        for (const [k, v] of Object.entries(src)) {
          if (Number.isFinite(v)) metrics[k] = v;
        }
      }
      rows.push({
        model,
        setting: trainingData,
        score,
        metrics,
      });
    }
    if (rows.length === 0) throw new Error('RoboTrack-Bench: parsed zero rows');
    return rows;
  },
};

export default board;
