// SoccerArena ranks World Cup forecasts by the sum of 90-minute match points.
// The released snapshot gives points for each match and forecast configuration.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const feed = "https://www.llm-soccerarena.com/releases/worldcup2026-2026-07-21-v1/snapshot.csv";
const board: Leaderboard = {
  benchmark: "llm-soccerarena-world-cup-2026",
  url: "https://www.llm-soccerarena.com/",
  feed,
  terms: "The repository uses the MIT license. I found no separate reuse license for the published scores. The site's robots.txt publishes content signals.",
  aliases: { 'Mistral Large 2512': 'mistral-large-3' },
  async fetch() {
    const runs = new Map<string, { model: string; setting: string; score: number; matches: Set<string>; exact: number; brier: number }>();
    for (const r of parseCsv(await fetchText(feed))) {
      if (r['Record type'] !== 'match_prediction' || r['Valid for scoring'] !== 'true' || !r['Points 90']) continue;
      const setting = [r.Horizon, r.Access, r.Prompt, 'sample ' + r['Sample ID']].join(', ');
      const key = JSON.stringify([r.Model, setting]);
      const run = runs.get(key) ?? { model: r.Model, setting, score: 0, matches: new Set<string>(), exact: 0, brier: 0 };
      const points = Number(r['Points 90']), brier = Number(r['Brier 90']);
      if (!r.Model || !r['Match ID'] || !r['Brier 90'] || ![points, brier].every(Number.isFinite) || run.matches.has(r['Match ID'])) throw new Error('Invalid match forecast');
      run.matches.add(r['Match ID']); run.score += points; run.brier += brier;
      if (r['Exact score correct 90'] === 'true') run.exact++;
      runs.set(key, run);
    }
    if (runs.size < 96) throw new Error('Missing World Cup configurations');
    return [...runs.values()].map(r => ({ model: r.model, setting: r.setting, score: r.score, trials: r.matches.size,
      metrics: { exact: r.exact, meanBrier: r.brier / r.matches.size } }));

  },
};
export default board;
