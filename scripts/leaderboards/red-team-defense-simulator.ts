// Red Team Defense Simulator tests jailbreak detection, safe responses and helpfulness in multi-turn attacks.
// The headline score is the published overall percentage combining defense, helpfulness, false-positive penalty and quality.
// This importer reads the environment README's performance table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/intertwine/security-verifiers/main/environments/sv-env-redteam-defense/README.md';

const board: Leaderboard = {
  benchmark: 'red-team-defense-simulator',
  url: 'https://github.com/intertwine/security-verifiers/tree/main/environments/sv-env-redteam-defense',
  feed,
  terms: 'The repository is MIT licensed. https://github.com/intertwine/security-verifiers/blob/main/LICENSE GitHub requests a one-second crawl delay.',
  stats: {
    defenseRate: { name: 'Defense rate', unit: '%', better: 'higher' },
    falsePositiveRate: { name: 'False positive rate', unit: '%', better: 'lower' },
    helpfulness: { name: 'Helpfulness', unit: '%', better: 'higher' },
  },
  async fetch() {
    const source = await fetchText(feed);
    const table = source.match(/\| Model\s*\| Defense Rate[\s\S]*?(?=\n\n|\n##)/)?.[0];
    if (!table) throw new Error('Missing red-team defense performance table');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/).slice(2)) {
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
      if (cells.length !== 5) continue;
      const [model, defenseRate, falsePositives, helpfulness, overall] = cells;
      const score = Number(overall.replace('%', ''));
      if (!Number.isFinite(score)) throw new Error('Invalid red-team defense score');
      rows.push({ model, score, metrics: { defenseRate: Number(defenseRate.replace('%', '')), falsePositiveRate: Number(falsePositives.replace('%', '')), helpfulness: Number(helpfulness.replace('%', '')) } });
    }
    if (rows.length < 2) throw new Error('Expected two red-team defense models');
    return rows;
  },
};

export default board;
