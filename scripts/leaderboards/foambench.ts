// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// FoamBench evaluates generated OpenFOAM simulations. The chart's paper_models series contains the original six models.
// The V2 results have a separate catalog entry.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/nithinsomu/cfdllmbench_v2/main/index.html';
const board: Leaderboard = {
  benchmark: 'foambench', url: 'https://nithinsomu.github.io/cfdllmbench_v2/#old-vs-new', feed,
  terms: 'The authors publish the chart and its data in their repository. https://github.com/nithinsomu/cfdllmbench_v2',
  parts: { basic: 'FoamBench Basic', advanced: 'FoamBench Advanced' },
  aliases: { 'Haiku 3.5': 'claude-3-5-haiku' },
  async fetch() {
    const html = await fetchText(feed);
    const json = html.match(/<script type="application\/json" id="bench-data">([\s\S]+?)<\/script>/)?.[1];
    if (!json) throw new Error('Missing benchmark data');
    const models: { name: string; foam: { basic: number; advanced: number } }[] = JSON.parse(json).paper_models;
    return checked(models.map(({ name, foam }) => {
      if (![foam.basic, foam.advanced].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) throw new Error('Invalid original FoamBench score');
      const metrics = { basic: foam.basic * 100, advanced: foam.advanced * 100 };
      return { model: name, harness: 'Foam-Agent 1.0', score: (metrics.basic + metrics.advanced) / 2, metrics };
    }), 6);
  },
};
export default board;
