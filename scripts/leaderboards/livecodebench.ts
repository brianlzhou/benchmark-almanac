// LiveCodeBench v4: mean code-generation pass@1 in the latest window assigned to this record. The official README
// describes releases through March, May, July and September 2024, all starting
// May 2023. These are calendar windows over the current feed, not frozen release manifests.
// Keep only v4 (May 2023 through September 2024); v5/v6 have separate records.
// Per-problem pass@1 is already a percentage. Training-cutoff dates are not submission dates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { LCB_FEED, LCB_PAGE, LCB_TERMS, LCB_ALIASES } from './livecodebench-v6.ts';
const board: Leaderboard = {
  benchmark: 'livecodebench', url: LCB_PAGE, feed: LCB_FEED, terms: LCB_TERMS, aliases: LCB_ALIASES,
  async fetch() {
    const data = await fetchJson<{ models: {model_repr: string}[]; performances: {model: string; date: number; 'pass@1': number}[] }>(LCB_FEED);
    const rows: LeaderboardRow[] = [];
    const windows = ['2024-10-01'];
    for (const end of windows) for (const m of data.models) {
      const scores = data.performances.filter(p => p.model === m.model_repr && p.date >= Date.parse('2023-05-01') && p.date < Date.parse(end));
      if (!scores.length) continue;
      rows.push({ model: m.model_repr.replace(/\(Med\)$/, '(Medium)'), setting: [`2023-05-01 to ${end} (exclusive)`, m.model_repr.match(/\((High|Med|Medium|Low|Max|XHigh)\)$/i)?.[1]?.replace(/^Med$/i,'Medium').toLowerCase()].filter(Boolean).join('; '), score: scores.reduce((s,p)=>s+p['pass@1'],0)/scores.length, metrics: { problems: scores.length } });
    }
    if (!rows.length) throw new Error('No v1–v4 results');
    return rows;
  },
};
export default board;
