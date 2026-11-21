// PII Arena ranks detectors by the percentage of Privy annotations fully hidden. Its published table selects eligible detectors from the larger raw results file.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://www.piiarena.com/datasets/privy";
const board: Leaderboard = {
  benchmark: 'privy-pii',
  url: "https://www.piiarena.com/datasets/privy",
  feed,
  terms: "The site allows crawling. PII Arena licenses its original publication material under MIT. https://github.com/Quakeer444/pii-arena/blob/main/README.md",
  host: 'PII Arena',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Detector|Family|Fully hidden ↑|Detected / any overlap ↑|Extra masking ↓|Char F1 ↑');
    if (!table || table.length < 41) throw new Error('Missing Privy detector results');
    return table.slice(1).map(c => {
      const model = c[0].text, values = c.slice(2).map(v => num(v.text));
      if (!model || values.length !== 4 || values.some(v => v == null)) throw new Error('Invalid detector result');
      const href = c[0].html.match(/href="([^"]+)"/)?.[1];
      return { model, score: values[0]!, metrics: { anyOverlap: values[1]!, extraMasking: values[2]!, charF1: values[3]! },
        link: href ? new URL(href, feed).href : undefined };
    });
  },
};
export default board;
