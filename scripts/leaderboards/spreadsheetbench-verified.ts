// SpreadsheetBench Verified (the 400-question V1 Verified tab). spreadsheetbench.github.io loads this tab
// from data/leaderboard-v1-verified.json: system name, organization, score (0 to 100) and submission date.
// Nearly every entry is a spreadsheet product or agent, not a model, so most rows stay unmatched. An entry
// written "Agent (Model)" names the model it ran on; the model is kept and the agent becomes the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { SSB_PAGE, SSB_TERMS, ssbFeed } from './spreadsheetbench.ts';

const FILE = 'leaderboard-v1-verified.json';

interface Entry {
  model: string;
  scaffold?: string;
  score?: number;
  date?: string;
}

const board: Leaderboard = {
  benchmark: 'spreadsheetbench-verified',
  url: SSB_PAGE,
  feed: ssbFeed(FILE),
  terms: SSB_TERMS,
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    for (const e of await fetchJson<Entry[]>(ssbFeed(FILE))) {
      if (!e.model || typeof e.score !== 'number') continue;
      const ran = e.model.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      const model = (ran ? ran[2] : e.model).replace(/^OpenAI\s+/, '').trim();
      const harness = ran ? ran[1].trim() : e.scaffold && e.scaffold !== e.model ? e.scaffold : undefined;
      rows.push({ model, score: e.score, harness, date: e.date });
    }
    return rows;
  },
};
export default board;
