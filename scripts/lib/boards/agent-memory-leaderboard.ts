// The four Cycle 1 boards have different task sets or entrant tracks. Never average across them.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson, fetchText } from '../util.ts';
import { jsonAfter } from '../html.ts';
const ROOT = 'https://agentmemoryleaderboard.ai';
export function amlBoard(benchmark: string, track: 'industry' | 'academic', type: 'textual' | 'coding'): Leaderboard {
  const feed = type === 'textual' ? `${ROOT}/static/cycle1-${track}-textual.json?v=pages-migration-20260919` : `${ROOT}/static/coding-data.js?v=pages-migration-20260919`;
  return {benchmark, url: `${ROOT}/leaderboard/${track}/${type}`, feed,
    terms: 'Public official Cycle 1 snapshots. The almanac credits Agent Memory Leaderboard and links the source.',
    async fetch(): Promise<LeaderboardRow[]> {
      if (type === 'coding') {
        const data = jsonAfter<{model: string; track: string; version?: string; datasets: {amlCoding: Record<string, number>}}[]>(await fetchText(feed), 'globalThis.CODING_ROWS_DATA =');
        if (!data?.length) throw new Error('AML coding data missing');
        return data.filter(r => r.track === track).map(r => ({model: r.model + ' (memory system)', setting: r.version,
          score: r.datasets.amlCoding.taskSolve, metrics: r.datasets.amlCoding}));
      }
      const data = await fetchJson<{entries: {target_version_label: string; average_score: number; metadata: {version?: string}; dataset_scores: {category_scores?: {category: string; score: number}[]}[]}[]}>(feed);
      if (!data.entries?.length) throw new Error('AML textual data missing');
      return data.entries.map(r => ({model: r.target_version_label + ' (memory system)', setting: r.metadata.version,
        score: r.average_score, metrics: Object.fromEntries(r.dataset_scores.flatMap(d => (d.category_scores ?? []).map(c => [c.category, c.score])))}));
    },
  };
}
