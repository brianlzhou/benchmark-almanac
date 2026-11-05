// RoboColiseum (AgiBot Genie Sim 3.0 challenge). robocoliseum.ai is a single-page app that reads its own
// JSON API: /api/challenge/leaderboard/overall lists every submission with an overall score (0 to 1, the
// mean of the instruction, spatial, manipulation and robustness boards) and its submit time. The overall
// score times 100 is the score, and the submit date is the run date. Entries mix robot policies from
// companies with frontier models run by the organizers (Claude Opus 5.5, GPT-6 Astra, Gemini 4 Argon).
// Each row also carries the four sub-board scores in `metrics` ("instruction", "spatial", "manip", "robust",
// each times 100).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const API = 'https://robocoliseum.ai/api/challenge/leaderboard/overall';

interface Page {
  items: { model_name: string; score: number; submit_time?: string; boards?: { board: string; score?: number }[] }[];
  total_pages: number;
}

const board: Leaderboard = {
  benchmark: 'robocoliseum',
  url: 'https://robocoliseum.ai/leaderboard',
  feed: `${API}?page=N&per-page=100 (overall score)`,
  terms: "Public JSON the leaderboard page reads; robocoliseum.ai serves no robots.txt rules (the path returns the app) and publishes no terms for the board.",
  aliases: {
    'Muse Wonder 1.0': 'muse-wonder',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (let page = 1; page <= 20; page++) {
      const data = await fetchJson<Page>(`${API}?page=${page}&per-page=100`);
      // "π₀.₅" to "pi0.5": the resolver's name key keeps ASCII letters and digits only
      const name = (n: string) => n.normalize('NFKC').replace(/π/g, 'pi');
      for (const e of data.items) {
        const metrics = Object.fromEntries(
          (e.boards ?? []).filter((b) => b.board && typeof b.score === 'number').map((b) => [b.board, Number((b.score! * 100).toFixed(2))]),
        );
        rows.push({ model: name(e.model_name), score: e.score * 100, date: e.submit_time?.slice(0, 10), ...(Object.keys(metrics).length ? { metrics } : {}) });
      }
      if (page >= data.total_pages) break;
    }
    return rows;
  },
};
export default board;
