// TMMLU++ v1.1 tests knowledge in Traditional Chinese. The versioned dataset card lists Total accuracy and four subject group scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/datasets/ikala/tmmluplus/raw/v1.1/README.md";
const groups = ['STEM', 'Social Science', 'Humanities', 'Other'];

const board: Leaderboard = {
  benchmark: "tmmlu-plus-1-1",
  url: "https://huggingface.co/datasets/ikala/tmmluplus/blob/v1.1/README.md",
  feed: FEED,
  terms: "The authors release the dataset under MIT in https://huggingface.co/datasets/ikala/tmmluplus/blob/v1.1/README.md.",
  parts: Object.fromEntries(groups.map(k => [k, k])),
  aliases: {"nvidia/nemotron-3-ultra-550b-a55b":"nemotron-3-ultra"},
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0].join('|') === ['Model', ...groups, 'Total'].join('|'));
    if (!table || table.length < 22) throw new Error('Incomplete TMMLU++ v1.1 table');
    return table.slice(1).map(([model, ...scores]) => {
      if (!model || scores.length !== 5 || !scores.every(v => v && Number.isFinite(Number(v)))) throw new Error('Missing TMMLU++ score');
      return { model, setting: model.endsWith(' (reasoning)') ? 'reasoning' : undefined, score: Number(scores[4]),
        metrics: Object.fromEntries(groups.map((k, i) => [k, Number(scores[i])])) };
    });
  },
};
export default board;
