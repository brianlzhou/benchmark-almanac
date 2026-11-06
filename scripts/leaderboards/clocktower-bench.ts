// Clocktower Bench (Dwarkesh Patel): models play Blood on the Clocktower against each other, one model on every
// good seat and another on every evil seat. The board is the ratings file the repository publishes for its
// charts: one Bradley–Terry rating per model on an Elo scale where 1500 is the average of the rated models, with
// its 90% interval and the separate detection (games as good) and deception (games as evil) ratings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw } from './big-bench-extra-hard.ts';

const REPO = 'dwarkeshsp/clocktower';
const FEED = ghRaw(REPO, 'docs/charts/datawrapper/ratings.csv');

const board: Leaderboard = {
  benchmark: 'clocktower-bench',
  url: 'https://clocktowerbench.com/',
  feed: `${FEED} (Elo)`,
  terms: 'The dwarkeshsp/clocktower repository is MIT licensed.',
  chart: {
    title: 'Detection vs deception',
    note: 'Each model gets one rating from its games as the town (detection) and one from its games as evil (deception).',
    x: { key: 'detection', label: 'Detection rating', unit: 'Elo', better: 'higher' },
    y: { key: 'deception', label: 'Deception rating', unit: 'Elo', better: 'higher' },
  },
  async fetch() {
    const [head, ...lines] = (await fetchText(FEED)).trim().split('\n').map((l) => l.split(','));
    const col = (name: string) => {
      const i = head.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
      if (i < 0) throw new Error(`Clocktower ratings have no "${name}" column`);
      return i;
    };
    const [iModel, iLab, iElo, iLow, iHigh, iDet, iDec, iGames] = ['Model', 'Lab', 'Elo', 'Low (90%)', 'High (90%)', 'Detection', 'Deception', 'Games'].map(col);
    const rows: LeaderboardRow[] = [];
    for (const l of lines) {
      const score = Number(l[iElo]);
      if (!l[iModel] || !Number.isFinite(score)) continue;
      // the file drops the brand of Anthropic's models: "Opus 5.5", "Fable 5.1"
      const model = l[iLab]?.trim() === 'Anthropic' && !/^claude/i.test(l[iModel]) ? `Claude ${l[iModel].trim()}` : l[iModel].trim();
      rows.push({
        model,
        setting: 'high effort',
        score,
        date: '2026-11-05',
        metrics: { ciLow: Number(l[iLow]), ciHigh: Number(l[iHigh]), detection: Number(l[iDet]), deception: Number(l[iDec]), games: Number(l[iGames]) },
      });
    }
    return rows;
  },
};
export default board;
