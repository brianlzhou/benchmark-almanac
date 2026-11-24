// TaxoBench compares model-generated research taxonomies against expert surveys.
// Tables 3 and 4 rank organization by adjusted Rand index (ARI) on paper clusters.
// Table 2 supplies retrieval metrics for the same agents. Tables 18 and 19 extend the bottom-up comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2601.12369';
const value = (s: string) => numberCell(s.replace(/[\s%]/g, ''));
const board: Leaderboard = {
  benchmark: 'taxobench', static: 'paper', url: feed, feed, harnesses: 'system',
  terms: 'The authors publish these tables under the license on the arXiv record. https://arxiv.org/abs/2601.12369',
  headline: 'The score is the paper’s adjusted Rand index for leaf-level clustering, expressed on its percentage scale.',
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(feed));
    const retrieval = tables.find(t => t[0][0] === 'Deep Research agent' && t[0][1].startsWith('Recall'));
    const agents = tables.find(t => t[0][0] === 'Deep Research agent' && t[0][1] === 'Leaf level');
    const low = tables.find(t => t[0].includes('Judge-free shape'));
    const high = tables.find(t => t[0][0] === 'Model (effort high )');
    const previous = tables.find(t => t[0][1] === 'Leaf-Level' && t[2]?.[0] === 'Non-thinking-based');
    if (!retrieval || !agents || !low || !high || !previous) throw new Error('TaxoBench comparison tables changed');
    const rows: LeaderboardRow[] = agents.slice(2).map(([model, ari, vMeasure, overlap, covered, ted, nted, path]) => {
      const r = retrieval.find(r => r[0] === model);
      if (!r) throw new Error('Missing retrieval results for ' + model);
      const [coveredARI, coveredVMeasure] = covered.split('/').map(value);
      return {model, harness: model + ' Deep Research', score: value(ari), metrics: {vMeasure: value(vMeasure), overlap: value(overlap),
        coveredARI, coveredVMeasure, treeEditDistance: value(ted), normalizedTreeEditDistance: value(nted), semPath: value(path),
        recall: value(r[1]), precision: value(r[2]), f1: value(r[3])}};
    });
    for (const [table, start, defaultEffort] of [[low, 2, 'lowest'], [high, 1, 'high']] as const) {
      for (const r of table.slice(start)) {
        if (r[0] === r[1] || r[0] === 'Expert reference') continue;
        const [raw, ari, hom, comp, nted, path, depth, cats, singleton] = r;
        const [model, effort] = raw.replace(/\s*†/g, '').split(', effort ');
        rows.push({model, setting: 'Bottom-up, requested effort ' + (effort || defaultEffort), score: value(ari),
          metrics: {homogeneity: value(hom), completeness: value(comp), normalizedTreeEditDistance: value(nted), semPath: value(path), depth: value(depth), categories: value(cats), singleton: value(singleton)}});
      }
    }
    let mode = '';
    for (const r of previous.slice(2)) {
      if (r[0] === r[1] || r.length === 1) { mode = r[0]; continue; }
      if (r[0].startsWith('Gemini-3-Pro-Thinking')) continue;
      const [label, ari, hom, comp, vMeasure, ted, nted, path] = r;
      const model = label.replace(/\s*†/g, '').replace(/\*/g, ' Preview');
      rows.push({model, setting: 'Bottom-up, ' + mode.toLowerCase(), score: value(ari), metrics: {
        homogeneity: value(hom), completeness: value(comp), vMeasure: value(vMeasure), treeEditDistance: value(ted), normalizedTreeEditDistance: value(nted), semPath: value(path)}});
    }
    return checked(rows, 34);
  },
};
export default board;
