// ARCS tests ambiguity resolution in text-to-SQL. The default ranking uses end-to-end execution accuracy.
// Read the HTML table in the project page's Markdown source.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://megagonlabs.github.io/tabulaflow/research/arcs/";
const feed = "https://raw.githubusercontent.com/megagonlabs/tabulaflow/main/docs/research/arcs.md";

const board: Leaderboard = {
  benchmark: 'arcs-text-to-sql', url, feed,
  terms: "The ARCS dataset uses CC BY 4.0. The page gives no separate score license. Neither host publishes applicable robots rules.",
  parts: { recall: 'Full Recall', perfect: 'Perfect', disamb: 'EX disamb' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === '#|Method|Full Recall|Perfect|EX disamb|EX e2e|ΔEX|Cost ($)');
    if (!table || table.length < 30) throw new Error('Incomplete ARCS leaderboard');
    return table.slice(2).map(c => {
      const name = c[1]?.text.match(/^([^ ]+)(?: \(([^)*]+)\*?\))?$/);
      if (!name || c.length !== 8 || c.slice(2).some(x => !/^-?\d+(?:\.\d+)?$/.test(x.text))) throw new Error('Invalid ARCS row');
      const [recall, perfect, disamb, score, delta, cost] = c.slice(2).map(x => Number(x.text));
      return { model: name[1], setting: name[2], score, cost, metrics: { recall, perfect, disamb, delta } };
    });
  },
};
export default board;
