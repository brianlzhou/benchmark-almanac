// The maker's default Current leaderboard sorts Overall by SE+, not a composite score.
// Preserve its 0–1 scale and other diagnostic axes. Monetary utility is not inference cost.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
const FEED = 'https://terms-bench.github.io/data.js?v=20260526-glm-open-ranking';
const board: Leaderboard = {
  benchmark: 'terms-bench', url: 'https://terms-bench.github.io/', feed: FEED,
  terms: 'Public maker-published results. The almanac credits TERMS-Bench and links the source.',
  stats: {
    mean_utility: { name: 'Mean utility', unit: 'score', better: 'higher' },
    se_plus: { name: 'Safety efficacy', unit: 'score', better: 'higher', note: 'Score from 0 to 1.' },
    agr_plus: { name: 'Action goal reliability', unit: 'score', better: 'higher', note: 'Score from 0 to 1.' },
    cse_plus: { name: 'Conditional safety efficacy', unit: 'score', better: 'higher', note: 'Score from 0 to 1.' },
    fagr_minus: { name: 'Failure action goal rate', unit: 'score', better: 'lower', note: 'Rate from 0 to 1.' },
    safe_term_minus: { name: 'Safe termination rate', unit: 'score', better: 'higher', note: 'Rate from 0 to 1.' },
    be_type: { name: 'Behavioral evaluation type', unit: 'score', note: 'Score from 0 to 1.' },
    stance_acc: { name: 'Stance accuracy', unit: 'score', better: 'higher', note: 'Score from 0 to 1.' },
    crit_viol_pct: { name: 'Critical violation rate', unit: 'score', better: 'lower', note: 'Rate from 0 to 1.' },
    conditional_utility: { name: 'Conditional utility', unit: 'score', better: 'higher' },
    n_episodes: { name: 'Episodes', unit: 'count' },
  },
  aliases: {'Doubao Seed 2.0 Pro': 'seed-2-0-pro', 'Gemma 4 31B': 'gemma-4-31b-it'},
  async fetch() {
    const d = jsonAfter<{rows: {display: string; kind: string; regimes: {overall: Record<string, number | null>}}[]}>(await fetchText(FEED), 'window.TERMS_DATA =');
    if (!d?.rows?.length) throw new Error('TERMS rows missing');
    return d.rows.filter(r => r.kind !== 'baseline').map(r => {
      if (typeof r.regimes.overall.se_plus !== 'number') throw new Error('TERMS SE+ missing');
      return {model: r.display === 'GPT-4o mini' ? r.display + ' (snapshot unspecified)' : r.display, score: r.regimes.overall.se_plus,
        setting: 'Overall; SE+', metrics: Object.fromEntries(Object.entries(r.regimes.overall).filter((x): x is [string, number] => typeof x[1] === 'number'))};
    });
  },
};
export default board;
