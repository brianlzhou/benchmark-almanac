// IG-Bench tests scientific lineage reasoning and idea generation.
// The project leaderboard lists IG-Exam exact accuracy first and gives IG-Arena PES and Elo alongside it.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://visionxlab.github.io/IdeasHaveGenomes/';
const board: Leaderboard = {
  benchmark: 'ig-bench', harnesses: 'system', url: feed, feed,
  headline: 'The authors report each track separately. The headline shows total IG-Exam exact accuracy.',
  terms: 'The authors publish the project leaderboard on GitHub Pages under the applicable terms at https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  parts: {
    t1: 'T1 Abstraction', t2: 'T2 Tracing', t3: 'T3 Reasoning', t4: 'T4 Verification',
    pes: { name: 'IG-Arena PES', unit: 'score' }, elo: { name: 'IG-Arena Elo', unit: 'elo' },
  },
  async fetch() {
    const t = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text))).find(t => t[0].join('|') === 'LLM-based Scientist|IG-Exam|IG-Arena');
    if (!t || t[1].join('|') !== 'T1 Abstraction|T2 Tracing|T3 Reasoning|T4 Verification|Total|PES|ELO') throw new Error('Missing IG-Bench leaderboard columns');
    return checked(t.slice(2).filter(r => r.length !== 1).map(([name, ...cells]) => {
      if (cells.length !== 7) throw new Error('Incomplete IG-Bench row');
      const [t1, t2, t3, t4, score, pes, elo] = cells.map(numberCell);
      const agent = name.match(/^(.+) \((.+)\)$/);
      return { model: agent?.[2] ?? name, harness: agent?.[1], score, metrics: { t1, t2, t3, t4, pes, elo } };
    }), 14);
  },
};
export default board;
