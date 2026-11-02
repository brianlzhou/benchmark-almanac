// LiveSQLBench on livesqlbench.ai. The page is server-rendered with one leaderboard table: Rank / Sub Date |
// Model | Organization | Success Rate | Cost / Task | Link. Success rate (0 to 100) is the score and Cost /
// Task (US dollars) the cost. A model run inside an agent reads "Claude Opus 4.6 (OpenHands CLI)", and the
// agent becomes the harness. Products built on a model ("AntQL 1.1 (Claude Opus 5.5)") stay unmatched. A
// trailing "Reported in ..." note marks a row the maker reported, and is dropped from the name. The reader
// lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://livesqlbench.ai/';

const board: Leaderboard = {
  benchmark: 'livesqlbench',
  url: URL,
  feed: `${URL} (leaderboard table, Success Rate)`,
  terms: 'Server-rendered public page; the site has no robots.txt and no terms, and the scores are cited to the BIRD team.',
  aliases: {
    'Kimi 2.5': 'kimi-k2-5',
    'Qwen3 Coder 480B': 'qwen3-coder-480b-a35b',
    'Mixtral 8x7B Instruct': 'mixtral-8x7b',
  },
  async fetch() {
    const rows = await tableRows(URL, { model: /^Model$/i, score: /^Success Rate$/i, cost: /^Cost \/ Task$/i });
    return rows.map((r) => {
      const name = r.model.replace(/\s+Reported\b.*$/i, '').trim();
      const agent = name.match(/\s*\(([^()]*(?:CLI|Claude Code|OpenHands|Codex|Agent)[^()]*)\)$/i);
      return agent ? { ...r, model: name.slice(0, agent.index).trim(), harness: agent[1] } : { ...r, model: name };
    });
  },
};
export default board;
