// SciDocs evaluates embeddings of scientific papers on classification, retrieval and recommendation.
// Table 1 of the SPECTER paper publishes an average across its seven tasks and all twelve component measures.
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';
const feed = 'https://aclanthology.org/2020.acl-main.207.pdf';
const names = ['MAG F1','MeSH F1','Co-View MAP','Co-View nDCG','Co-Read MAP','Co-Read nDCG',
  'Cite MAP','Cite nDCG','Co-Cite MAP','Co-Cite nDCG','Recommendation nDCG','Recommendation P@1'];
const board: Leaderboard = {
  benchmark: 'scidocs', url: feed, feed, static: 'paper', parts: Object.fromEntries(names.map(name => [name,name])),
  terms: 'The authors publish the paper through ACL Anthology. https://aclanthology.org/2020.acl-main.207/',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 1: Results on the S CI D OCS evaluation suite')[0].split('Task →').at(-1);
    if (!table || !table.includes('Co-View') || !table.includes('P@1') || !table.includes('Avg.')) throw new Error('Missing SciDocs Table 1 columns');
    const body = table.split(/\nRandom\s+[^\n]+\n/)[1];
    if (!body) throw new Error('Missing SciDocs comparison rows');
    return checked(body.trim().split('\n').map(line => {
      const [label, ...cells] = line.trim().split(/\s{2,}/);
      const values = cells.flatMap(cell => cell.split(/\s+/).map(Number));
      if (values.length !== 13 || !values.every(Number.isFinite)) throw new Error('Unexpected Table 1 row: ' + line);
      const model = label.replace(/ \((?:\d{4}[a-z]?|Ours)\)$/, '').replace('S PECTER','SPECTER');
      return {model, score: values[12], metrics: Object.fromEntries(names.map((name, i) => [name, values[i]]))};
    }), 9);
  },
};
export default board;
