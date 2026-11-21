// GTBench ranks game-playing agents by their average reward advantage against a named opponent.
// The Gradio Space serves the displayed Average and the individual game scores in its initial configuration.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://gtbench-gtbench.hf.space/config';
interface Table { headers: string[]; data: (number | string)[][] }
const board: Leaderboard = {
  benchmark: 'gtbench', url: 'https://huggingface.co/spaces/GTBench/GTBench', feed,
  terms: 'Public leaderboard published by the GTBench authors on Hugging Face.',
  async fetch() {
    const config = await fetchJson<{ components: { type: string; props: { value?: Table } }[] }>(feed);
    const table = config.components.find(c => c.type === 'dataframe' && c.props.value?.headers.includes('Average'))?.props.value;
    const cols = ['Model', 'Agent', 'Opponent Model', 'Opponent Agent', 'Average'];
    if (!table || table.data.length < 22 || !cols.every((v, i) => table.headers[i] === v)) throw new Error('Incomplete GTBench table');
    const games = table.headers.slice(5).filter(c => c && !c.startsWith('Unnamed'));
    if (games.length < 10) throw new Error('Missing GTBench game scores');
    board.parts = Object.fromEntries(games.map(g => [g, g]));
    return table.data.map(r => {
      if (!r[0] || !r[1] || !r[2] || !r[3] || !Number.isFinite(r[4])) throw new Error('Missing GTBench configuration');
      const metrics = Object.fromEntries(games.map(game => {
        const value = r[table.headers.indexOf(game)];
        if (typeof value !== 'number') throw new Error('Missing GTBench score for ' + game);
        return [game, value];
      }));
      return { model: String(r[0]), harness: String(r[1]), setting: `Opponent: ${r[2]} (${r[3]})`, score: Number(r[4]), metrics };
    });
  },
};
export default board;
