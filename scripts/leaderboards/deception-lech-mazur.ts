// The first ranking in the README measures how effectively each model deceives its peers.
// The second table reports vulnerability to disinformation on the same question set.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';
import { LECH_MAZUR_ALIASES } from './nyt-connections-extended.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/deception/HEAD/README.md";


const board: Leaderboard = {
  benchmark: "deception-lech-mazur",
  url: "https://github.com/lechmazur/deception",
  feed,
  terms: "The publisher displays results at https://github.com/lechmazur/deception. I could not verify reuse terms. The raw host serves no robots.txt rules.",
  aliases: LECH_MAZUR_ALIASES,
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const scores = (label:string) => {
      const table = tables.find(t => t[0]?.join('|') === 'Model|' + label);
      if (!table || table.length < 19) throw new Error('Missing ' + label);
      return new Map(table.slice(1).map(([name, value]) => {
        if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid ' + label);
        return [name, Number(value)];
      }));
    };
    const vulnerability = scores('Vulnerability Score');
    return [...scores('Deception Score')].map(([model, score]) => {
      if (!vulnerability.has(model)) throw new Error('Missing vulnerability for ' + model);
      return { model, score, metrics: { vulnerability: vulnerability.get(model)! } };
    });
  },
};
export default board;
