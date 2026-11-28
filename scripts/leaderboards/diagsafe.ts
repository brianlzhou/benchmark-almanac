// DiagSafe — Tencent Hunyuan bilingual diagnostic safety and usefulness benchmark.
// Reads the frontier leaderboard markdown table in Tencent-Hunyuan/DiagSafe README.
// Source README plots each model on the safety-versus-usefulness plane (assets/safety_usefulness_by_l1.png).

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/Tencent-Hunyuan/DiagSafe/main/README.md';

const board: Leaderboard = {
  benchmark: 'diagsafe',
  feed: FEED,
  url: 'https://github.com/Tencent-Hunyuan/DiagSafe',
  terms: 'Public repository README published by Tencent Hunyuan.',
  aliases: {
    'Hy4-Preview': 'tencent-hy4-preview',
  },
  parts: {
    diagBase: { name: 'DiagBase', group: 'Subset' },
    diagAttack: { name: 'DiagAttack', group: 'Subset' },
  },
  stats: {
    usefulness: { name: 'Usefulness', unit: 'score', better: 'higher' },
  },
  chart: {
    title: 'Safety vs Usefulness',
    x: { key: 'usefulness', label: 'Usefulness', unit: 'score', better: 'higher' },
    y: { key: 'score', label: 'Overall unsafe rate', unit: '%', better: 'lower' },
    note: 'Lower overall unsafe rate and higher usefulness are better. Usefulness is scored on a 0 to 3 scale.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const md = await fetchText(FEED);
    const lines = md.split(/\r?\n/);
    const hdrIdx = lines.findIndex((l) => /\|\s*Model\s*\|.*Overall.*DiagBase.*DiagAttack.*Usefulness/i.test(l));
    if (hdrIdx < 0) throw new Error('DiagSafe leaderboard table not found in README');

    const rows: LeaderboardRow[] = [];
    for (let i = hdrIdx + 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('|')) break;
      const cells = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
      if (cells.length < 5) continue;
      const rawModel = cells[0];
      const hasDagger = /†/.test(rawModel);
      const model = rawModel
        .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
        .replace(/[*_`†]/g, '')
        .trim();
      const score = num(cells[1]);
      if (!model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const diagBase = num(cells[2]);
      const diagAttack = num(cells[3]);
      const usefulness = num(cells[4]);
      if (diagBase !== undefined) metrics.diagBase = diagBase;
      if (diagAttack !== undefined) metrics.diagAttack = diagAttack;
      if (usefulness !== undefined) metrics.usefulness = usefulness;
      const row: LeaderboardRow = { model, score, metrics };
      if (hasDagger) row.setting = 'low reasoning effort';
      rows.push(row);
    }

    if (rows.length < 5) throw new Error(`DiagSafe parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
