// TREC Product Search tests ranked retrieval of shopping items. The headline is normalized discounted cumulative gain.
// Table 1 of Jeonbuk National University's NIST proceedings paper reports the team's twelve official runs.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://trec.nist.gov/pubs/trec33/papers/jbnu.product.pdf';
// Section 2 identifies the retrievers and the run tags that distinguish preprocessing and model fusions.
const retrievers: Record<string, string[]> = {
  jbnu01: ['SPLADE++'], jbnu02: ['SPLADE++'], jbnu03: ['TAS-B'], jbnu04: ['ColBERTv2'],
  jbnu05: ['SPLADE++', 'TAS-B'], jbnu06: ['SPLADE++', 'ColBERTv2'], jbnu07: ['SPLADE++', 'TAS-B'],
  jbnu08: ['SPLADE++', 'ColBERTv2'], jbnu09: ['SPLADE++'], jbnu10: ['BM25', 'ColBERTv2'],
  jbnu11: ['SPLADE++', 'TAS-B'], jbnu12: ['SPLADE++', 'ColBERTv2'],
};
const board: Leaderboard = {
  benchmark: 'trec-product-search-2024', feed, url: feed, static: 'paper',
  terms: 'NIST hosts the authors’ proceedings paper under the terms at https://www.nist.gov/disclaimer.',
  async fetch() {
    const paper = await pdfText(feed);
    const match = /Run Name\s+NDCG\s+NDCG@20\s+NDCG@100\s+P@5\s+P@100\s+MAP([\s\S]+?)Table 1\. Results of Product Ranking Task/.exec(paper);
    if (!match) throw new Error('Missing product ranking table');
    const rows = match[1].split('\n').filter(line => /^\s*jbnu/.test(line)).map(line => {
      const [tag, ...cells] = line.trim().split(/\s+/);
      const values = cells.map(Number);
      const models = retrievers[tag];
      if (!models || values.length !== 6 || !values.every(Number.isFinite)) throw new Error('Invalid product ranking run: ' + tag);
      const [score, ndcg20, ndcg100, precision5, precision100, map] = values;
      return { model: models[0], models: models.length > 1 ? models : undefined, submitter: 'jbnu', setting: tag,
        score, metrics: { ndcg20, ndcg100, precision5, precision100, map } };
    });
    return checked(rows, 12);
  },
};
export default board;
