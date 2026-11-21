// TREC ranks related-product runs by related average nDCG. The NIST proceedings appendix also publishes the complementary and substitute measures.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://trec.nist.gov/pubs/trec34/appendices/trec2025-product-rec.html";
const board: Leaderboard = {
  benchmark: 'trec-related-product-recommendation-2025',
  url: "https://trec.nist.gov/pubs/trec34/appendices/trec2025-product-rec.html",
  feed,
  terms: "NIST disallows /results and allows the proceedings appendix. NIST requires context and a link to the proceedings. Its agreement restricts advertising and named comparisons. https://trec.nist.gov/noads.html",
  parts: {"complementary_diversity":"complementary diversity","complementary_nDCG_10":"complementary nDCG 10","related_PoolNDCG_10":"related PoolNDCG 10","related_agreement":"related agreement","substitute_diversity":"substitute diversity","substitute_nDCG_10":"substitute nDCG 10"},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Runtag|Org|related_avg_ndcg|complementary_diversity|complementary_nDCG_10|related_PoolNDCG_10|related_agreement|substitute_diversity|substitute_nDCG_10');
    if (!table || table.length < 6) throw new Error('Missing TREC search runs');
    return table.slice(1).map(c => {
      const anchor = c[0].html.match(/<a href="([^"]+)">([^<]+)<\/a>/), values = c.slice(2).map(v => v.text ? Number(v.text) : NaN);
      if (!anchor || values.length !== 7 || !values.every(Number.isFinite)) throw new Error('Missing TREC evaluation');
      return { model: text(anchor[2]), submitter: c[1].text, link: new URL(anchor[1], feed).href, score: values[0],
        metrics: { complementary_diversity: values[1], complementary_nDCG_10: values[2], related_PoolNDCG_10: values[3], related_agreement: values[4], substitute_diversity: values[5], substitute_nDCG_10: values[6] } };
    });
  },
};
export default board;
