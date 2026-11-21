// I2P measures the percentage of generated images that classifiers mark inappropriate.
// The authors' README reports overall probability and maximum expected inappropriateness, with a separate category table.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/ml-research/i2p/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'inappropriate-image-prompts', url: 'https://github.com/ml-research/i2p', feed,
  terms: 'Public author results hosted under the applicable GitHub terms at https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  parts: { sexual: { name: 'Sexual', unit: '%', better: 'lower' } },
  stats: {
    maxExpected: {name: 'Maximum expected inappropriateness', unit: '%', better: 'lower'},
    sexualMaxExpected: {name: 'Sexual maximum expected inappropriateness', unit: '%', better: 'lower'},
    maxExpectedSpread: {name: 'Maximum expected inappropriateness spread', unit: '%', better: 'lower'},
    sexualMaxExpectedSpread: {name: 'Sexual maximum expected inappropriateness spread', unit: '%', better: 'lower'},
  },
  async fetch() {
    const readme = await fetchText(feed);
    function read(section: string) {
      const block = readme.split('### Category: ' + section)[1]?.split(/^### /m)[0];
      if (!block?.includes('Inappropriateness probability') || !block.includes('Max. exp. inappropriateness')) throw new Error('Missing I2P columns');
      const scores = new Map<string, { probability: number; maximum: number; spread: number }>();
      for (const line of block.split('\n').filter(l => l.startsWith('|')).slice(2)) {
        const [label, probability, maximum] = line.split('|').slice(1, -1).map(v => v.trim());
        if (/^(?:todo run|todo impl|waiting release|running)$/.test(probability)) continue;
        const model = label.match(/^\[([^\]]+)\]/)?.[1] ?? label;
        const pair = maximum.match(/^([\d.]+)%\s*±\s*([\d.]+)%$/);
        if (!pair || !probability.endsWith('%') || scores.has(model)) throw new Error('Invalid I2P result');
        scores.set(model, { probability: numberCell(probability.slice(0, -1)), maximum: numberCell(pair[1]), spread: numberCell(pair[2]) });
      }
      return scores;
    }
    const subset = read('"Sexual"');
    return checked([...read('all')].map(([label, all]) => {
      const safe = label.match(/^(Safe SD [\d.]+) \((\w+)\)$/);
      const metrics: Record<string, number> = { maxExpected: all.maximum, maxExpectedSpread: all.spread };
      const sub = subset.get(label);
      if (sub) Object.assign(metrics, { sexual: sub.probability, sexualMaxExpected: sub.maximum, sexualMaxExpectedSpread: sub.spread });
      return { model: safe?.[1] ?? label, setting: safe?.[2], score: all.probability, metrics };
    }), 3);
  },
};
export default board;
