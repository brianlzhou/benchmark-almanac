// SafeClawArena (UC Berkeley, UIUC, NUS, Google DeepMind, NVIDIA, and collaborators):
// 406 adversarial tasks across 4 architectural attack surfaces (SSI, PSE, CDF, IPI) on 15 (platform, model) configs.
// Reads Table 5 from static/js/leaderboard.js. Headline is Overall Attack Success Rate (%, lower is better).
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://safeclawarena.github.io/';
const FEED = 'https://safeclawarena.github.io/static/js/leaderboard.js';

interface SafeClawEntry {
  platform: string;
  model: string;
  ssi_atk: number;
  ssi_sc: number;
  pse_atk: number;
  pse_sc: number;
  cdf_atk: number;
  cdf_sc: number;
  ipi_atk: number;
  ipi_sc: number;
  overall_atk: number;
  overall_sc: number;
}

const board: Leaderboard = {
  benchmark: 'safeclawarena',
  url: PAGE,
  feed: FEED,
  terms: 'Public leaderboard data (Table 5) published on GitHub Pages by the SafeClawArena authors.',
  static: 'paper',
  harnesses: 'system',
  parts: {
    ssiAtk: { name: 'SSI attack success', group: 'Attack surface', better: 'lower' },
    pseAtk: { name: 'PSE attack success', group: 'Attack surface', better: 'lower' },
    cdfAtk: { name: 'CDF attack success', group: 'Attack surface', better: 'lower' },
    ipiAtk: { name: 'IPI attack success', group: 'Attack surface', better: 'lower' },
  },
  stats: {
    securityScore: { name: 'Security score', unit: 'score', better: 'higher', note: 'Overall security score on a 0 to 1 scale (higher is more secure).' },
    ssiScore: { name: 'SSI security score', unit: 'score', better: 'higher' },
    pseScore: { name: 'PSE security score', unit: 'score', better: 'higher' },
    cdfScore: { name: 'CDF security score', unit: 'score', better: 'higher' },
    ipiScore: { name: 'IPI security score', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`SafeClawArena leaderboard.js: ${res.status}`);
    const js = await res.text();
    const m = js.match(/const\s+DATA\s*=\s*(\[[\s\S]*?\]);/);
    if (!m) throw new Error('SafeClawArena: DATA array not found');

    // Parse JS object literals (unquoted keys, trailing commas) cleanly into JSON.
    const jsonLike = m[1]
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/,\s*([}\]])/g, '$1');
    const entries = JSON.parse(jsonLike) as SafeClawEntry[];

    const rows: LeaderboardRow[] = [];
    for (const e of entries) {
      if (!e.model || typeof e.overall_atk !== 'number') continue;
      rows.push({
        model: e.model,
        harness: e.platform,
        score: e.overall_atk,
        metrics: {
          ssiAtk: e.ssi_atk,
          pseAtk: e.pse_atk,
          cdfAtk: e.cdf_atk,
          ipiAtk: e.ipi_atk,
          securityScore: e.overall_sc,
          ssiScore: e.ssi_sc,
          pseScore: e.pse_sc,
          cdfScore: e.cdf_sc,
          ipiScore: e.ipi_sc,
        },
      });
    }
    if (rows.length === 0) throw new Error('SafeClawArena: parsed zero rows');
    return rows;
  },
};

export default board;
