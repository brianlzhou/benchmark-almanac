// The TREC 2025 Product Search appendix orders runs by graded nDCG. It also publishes mean average precision and recall at 1,000.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://trec.nist.gov/pubs/trec34/appendices/trec2025-product-search.html";
const board: Leaderboard = {
  benchmark: 'trec-product-search-2025',
  url: "https://trec.nist.gov/pubs/trec34/appendices/trec2025-product-search.html",
  feed,
  terms: "NIST disallows /results and allows the proceedings appendix. NIST requires context and a link to the proceedings. Its agreement restricts advertising and named comparisons. https://trec.nist.gov/noads.html",
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Runtag|Org|ndcg_0=0,1=0,2=1,3=10|map|recall_1000');
    if (!table || table.length < 22) throw new Error('Missing TREC search runs');
    return table.slice(1).map(c => {
      const anchor = c[0].html.match(/<a href="([^"]+)">([^<]+)<\/a>/), values = c.slice(2).map(v => v.text ? Number(v.text) : NaN);
      if (!anchor || values.length !== 3 || !values.every(Number.isFinite)) throw new Error('Missing TREC evaluation');
      return { model: text(anchor[2]), submitter: c[1].text, link: new URL(anchor[1], feed).href, score: values[0],
        metrics: { map: values[1], recall1000: values[2] } };
    });
  },
};
export default board;
