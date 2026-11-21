// TREC ranks expert retrieval runs by nDCG at five. The proceedings appendix gives precision, recall and the link to each run.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://trec.nist.gov/pubs/trec34/appendices/trec2025-mllm-main.html";
const board: Leaderboard = {
  benchmark: 'trec-million-llms-2025',
  url: "https://trec.nist.gov/pubs/trec34/appendices/trec2025-mllm-main.html",
  feed,
  terms: "NIST disallows /results and allows the proceedings appendix. NIST requires context and a link to the proceedings. Its agreement restricts advertising and named comparisons. https://trec.nist.gov/noads.html",
  parts: {"p5":"P_5","recall1000":"recall_1000"},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Runtag|Org|ndcg_cut_5|P_5|recall_1000');
    if (!table || table.length < 20) throw new Error('Missing TREC search runs');
    return table.slice(1).map(c => {
      const anchor = c[0].html.match(/<a href="([^"]+)">([^<]+)<\/a>/), values = c.slice(2).map(v => v.text ? Number(v.text) : NaN);
      if (!anchor || values.length !== 3 || !values.every(Number.isFinite)) throw new Error('Missing TREC evaluation');
      return { model: text(anchor[2]), submitter: c[1].text, link: new URL(anchor[1], feed).href, score: values[0],
        metrics: { p5: values[1], recall1000: values[2] } };
    });
  },
};
export default board;
