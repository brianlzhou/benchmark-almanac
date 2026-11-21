// Emergent Price-Fixing by LLM Auction Agents measures how often each model reaches a severe illegality score.
// The headline is the percentage of games with an illegality score of at least 7.
// This importer reads the model breakdown table in the author's public README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE = 'https://github.com/lechmazur/emergent_collusion';
const FEED = 'https://raw.githubusercontent.com/lechmazur/emergent_collusion/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'emergent-collusion-lech-mazur', url: PAGE, feed: `${FEED} (model-by-model breakdown table)`, static: 'paper',
  terms: 'The author publishes the results in the repository README. The repository gives no separate score reuse license. Results are credited to Lech Mazur.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED); const table = text.match(/\| Model[\s\S]*?(?=\n\n|$)/)?.[0]; if (!table) throw new Error('Emergent collusion: model table missing');
    const rows = table.split('\n').slice(2).map((line) => line.split('|').map((c) => c.trim()).filter(Boolean)).filter((c) => c.length >= 2);
    if (rows.length !== 13) throw new Error(`Emergent collusion: ${rows.length} rows, expected 13`);
    return rows.map(([model, raw]) => { const score = Number(raw.replace('%', '')); if (!model || !Number.isFinite(score)) throw new Error(`Emergent collusion: invalid row ${model}`); return { model: model.replace(/^\*\*|\*\*$/g, ''), score }; });
  },
};
export default board;
