// VisEditBench ranks TikZ editing runs by the percentage receiving full marks on all three image criteria.
// The project table also reports image ratings, compilation failures and code ratings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://viseditbench.github.io/#leaderboard";

const board: Leaderboard = {
  benchmark: "viseditbench-tikz",
  url: "https://viseditbench.github.io/#leaderboard",
  feed,
  stats: {
    imageIA: {name: 'Image instruction adherence', unit: 'score', better: 'higher', note: 'Image-level instruction adherence rated on a five-point scale.'},
    imageCP: {name: 'Image content preservation', unit: 'score', better: 'higher', note: 'Image-level content preservation rated on a five-point scale.'},
    imageDR: {name: 'Image design quality', unit: 'score', better: 'higher', note: 'Image-level design quality rated on a five-point scale.'},
    compilationFailureRate: {name: 'Compilation failure rate', unit: '%', better: 'lower'},
    codeIA: {name: 'Code instruction adherence', unit: 'score', better: 'higher'},
    codeCP: {name: 'Code content preservation', unit: 'score', better: 'higher'},
    codeOES: {name: 'Overall edit score', unit: 'score', better: 'higher', note: 'Holistic score combining code-level instruction adherence and content preservation.'},
  },
  terms: "The website uses CC BY-SA 4.0. The host has no robots.txt.",
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[1]?.map(c => c.text.split(' ')[0]).join('|') === 'Model|IA|CP|DR|FSR|CFR|IA|CP|OES');
    if (!table) throw new Error('Missing TikZ editing table');
    let open = false;
    const rows = table.slice(2).flatMap(cells => {
      if (cells.length === 1 && /^(Closed|Open)-source models$/.test(cells[0].text)) {
        open = cells[0].text.startsWith('Open'); return [];
      }
      const values = cells.slice(1).map(c => Number(c.text || NaN));
      if (values.length !== 8 || !values.every(Number.isFinite)) throw new Error('Invalid TikZ results');
      const [imageIA, imageCP, imageDR, score, compilationFailureRate, codeIA, codeCP, codeOES] = values;
      const label = cells[0].text;
      const thinking = label.endsWith(' Thinking');
      return [{ model: thinking ? label.replace(/ Thinking$/, '') : label, setting: thinking ? 'Thinking' : undefined, score, open,
        metrics: { imageIA, imageCP, imageDR, compilationFailureRate, codeIA, codeCP, codeOES } }];
    });
    if (rows.length < 29) throw new Error('Incomplete TikZ standings');
    return rows;
  },
};
export default board;
