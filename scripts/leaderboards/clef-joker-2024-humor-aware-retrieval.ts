// JOKER 2024 ranks humour-aware retrieval systems by mean average precision. Table 3 in the organizers' report contains the official test results.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://ceur-ws.org/Vol-3740/paper-165.pdf#page=7";
const columns = ["map", "ndcg", "R5", "R10", "R100", "R1000", "bpref", "MRR", "P1", "P5", "P10"];

const board: Leaderboard = {
  benchmark: "clef-joker-2024-humor-aware-retrieval", static: 'paper',
  url: "https://ceur-ws.org/Vol-3740/paper-165.pdf#page=7",
  feed: FEED,
  terms: "The authors publish this results table under CC BY 4.0. https://ceur-ws.org/Vol-3740/paper-165.pdf#page=1 CEUR-WS robots.txt permits the published volume.",
  stats: Object.fromEntries(columns.map(key => [key, { name: ({map:'Mean average precision',ndcg:'Normalized discounted cumulative gain',R5:'Recall at 5',R10:'Recall at 10',R100:'Recall at 100',R1000:'Recall at 1000',bpref:'Binary preference',MRR:'Mean reciprocal rank',P1:'Precision at 1',P5:'Precision at 5',P10:'Precision at 10'} as Record<string,string>)[key], unit: 'score', better: 'higher' }])),
  async fetch() {
    const paper = await pdfText(FEED);
    const section = paper.split("Results on the test data. (Boldface indicates the best result per metric.)")[1]?.split("4. Results")[0];
    if (!section) throw new Error('Missing published results table');
    const lines = section.trim().split(/\r?\n/);
    if (!columns.every((key) => lines[0].includes(key))) throw new Error('Changed results columns');
    const rows = lines.slice(1).filter((line) => line.trim()).map((line) => {
      const cells = line.trim().split(/\s+/);
      const values = cells.splice(-columns.length).map(Number);
      const model = cells.join(' ');
      if (!model || values.length !== columns.length || !values.every(Number.isFinite)) throw new Error(`Invalid row: ${line}`);
      const metrics = Object.fromEntries(columns.map((key, index) => [key, values[index]]));
      return { model, score: metrics["map"], metrics };
    });
    if (rows.length < 11) throw new Error('Expected at least 11 scored runs');
    return rows;
  },
};
export default board;
