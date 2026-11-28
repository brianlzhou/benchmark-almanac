// FDA tests whether a model can extract requested attributes from regulatory documents.
// The Based README gives accuracy for six checkpoints evaluated with the released harness.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/HazyResearch/based/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'fda-information-extraction-based',
  url: 'https://github.com/HazyResearch/based#running-evaluations',
  feed,
  terms: 'Apache License 2.0 at https://github.com/HazyResearch/based/blob/main/LICENSE.md.',
  async fetch() {
    const readme = await fetchText(feed);
    const table = readme.split(/\r?\n\s*\r?\n/).find(block => block.includes('| *FDA*'));
    if (!table) throw new Error('FDA results table missing');
    const lines = table.split('\n').filter(line => line.startsWith('|'));
    const cells = (line: string) => line.split('|').slice(1, -1).map(cell => cell.replace(/\*/g, '').trim());
    if (cells(lines[0]).join('|') !== 'Architecture|Size|HuggingFace|SWDE|FDA|SQUAD') throw new Error('FDA columns changed');
    return checked(lines.slice(2).map(line => {
      const [arch, size, checkpoint, , accuracy] = cells(line);
      const link = checkpoint.match(/\((https:\/\/huggingface\.co\/hazyresearch\/[^)]+)\)/)?.[1];
      if (!link) throw new Error('Missing model checkpoint');
      const mSize = size.match(/^(\d+(?:\.\d+)?)([mb])$/i);
      const params = mSize ? (mSize[2].toLowerCase() === 'm' ? Number((Number(mSize[1]) / 1000).toFixed(3)) : Number(mSize[1])) : undefined;
      return { model: arch + ' ' + size, link, params, score: numberCell(accuracy) };
    }), 6);
  },
};
export default board;
