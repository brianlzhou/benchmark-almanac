// FantasyFootballBench replays an NFL season. The linked simulation's final standings CSV ranks model teams by wins, with total points breaking ties.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/aryatschand/FantasyFootballBench/main/data/simulations/simulation_20251020_174956/season_results/final_standings_2024.csv";

const board: Leaderboard = {
  benchmark: "fantasyfootballbench",
  url: "https://github.com/aryatschand/FantasyFootballBench/blob/main/data/simulations/simulation_20251020_174956/season_results/final_standings_2024.csv",
  feed: FEED,
  terms: "The repository identifies SportsData.io as the source of proprietary NFL data. https://github.com/aryatschand/FantasyFootballBench GitHub requests a one-second crawl delay.",
  async fetch() {
    const records = parseCsv(await fetchText(FEED));
    if (records.length < 10) throw new Error('Expected ten fantasy football teams');
    return records.map((r) => {
      if (!r.Team || !['Wins', 'Losses', 'Ties', 'PointsFor'].every((key) => r[key]?.trim() && Number.isFinite(Number(r[key])))) throw new Error('Incomplete final standings');
      const name = r.Team.match(/^(.+)_Team_\d+$/)?.[1];
      if (!name) throw new Error(`Unexpected team label: ${r.Team}`);
      return { model: name.replaceAll('_', ' '), score: Number(r.Wins), setting: 'Simulation 20251020_174956', date: '2025-10-20',
        metrics: { losses: Number(r.Losses), ties: Number(r.Ties), pointsFor: Number(r.PointsFor) } };
    });
  },
};
export default board;
