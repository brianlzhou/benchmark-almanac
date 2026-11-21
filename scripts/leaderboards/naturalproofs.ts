// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// NaturalProofs tests retrieval of references used in mathematical proofs.
// Table 5 reports test-set mean average precision (mAP) and retrieval coverage for ProofWiki and Stacks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2104.01112v2';
const domains = ['ProofWiki', 'Stacks'];
const measures = ['mAP', 'R@10', 'R@100', 'Full@10', 'Full@100'];
const labels = domains.flatMap(domain => measures.map(m => domain + ' ' + m));
const keys = labels.map(l => l.replace(/[ @]/g, ''));
const board: Leaderboard = {
  benchmark: 'naturalproofs', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall retrieval score, so this is the plain mean of ProofWiki and Stacks test mAP.',
  parts: Object.fromEntries(keys.map((key,i) => [key, labels[i]])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.[2] === 'ProofWiki' && t[0]?.[7] === 'Stacks' &&
      t[1]?.slice(2).join('|') === [...measures, ...measures].join('|'));
    if (!table) throw Error('Missing Table 5 retrieval results');
    const rows: LeaderboardRow[] = [];
    for (const [name, variant, ...values] of table.slice(2)) {
      if (['Random', 'Frequency'].includes(name)) continue;
      if (values.length !== keys.length) throw Error('Missing retrieval metrics');
      const metrics = Object.fromEntries(values.map((v,i) => [keys[i], numberCell(v)]));
      const model = name === variant ? name : name + ' ' + variant;
      rows.push({ model, score: (metrics.ProofWikimAP + metrics.StacksmAP) / 2, metrics });
    }
    return checked(rows, 5);
  },
};
export default board;
