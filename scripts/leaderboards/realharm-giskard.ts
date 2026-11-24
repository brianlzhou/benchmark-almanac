// RealHarm tests whether moderators detect harmful conversations from documented incidents.
// Table 3 reports detection rates. The headline is the percentage of unsafe conversations detected.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/pdf/2504.10277';
const board: Leaderboard = {
  benchmark:'realharm-giskard',static:'paper',url:'https://realharm.giskard.ai/',feed,
  terms:'The authors publish Table 3 under the license linked at https://arxiv.org/abs/2504.10277.',
  stats:{tp:{name:'True positives',unit:'count'},fp:{name:'False positives',unit:'count'},
    fpr:{name:'Reported false positive rate',unit:'%',better:'lower'},precision:{name:'Precision',unit:'%',better:'higher'},
    f1:{name:'F1',unit:'%',better:'higher'}},
  async fetch() {
    const pdf = await pdfText(feed);
    const table = pdf.match(/Moderator\s+# TP\s+TPR\s+# FP\s+FPR\s+Precision\s+Recall\s+F1\s*\n([^\f]*?)\n\s*\n/);
    if (!table) throw new Error('RealHarm Table 3 columns missing');
    return checked(table[1].trim().split('\n').map(line=>{
      const cells = line.trim().match(/^(.+?)\s+(\d+)\s+([\d.]+) %\s+(\d+)\s+([\d.]+) %\s+([\d.]+) %\s+([\d.]+) %\s+([\d.]+) %$/);
      if (!cells || cells[3]!==cells[7]) throw new Error('Unexpected moderator result');
      const model = cells[1].replace(/^LLM \((.+)\)$/,'$1');
      return {model,score:Number(cells[3]),metrics:{tp:Number(cells[2]),fp:Number(cells[4]),
        fpr:Number(cells[5]),precision:Number(cells[6]),f1:Number(cells[8])}};
    }),13);
  },
};
export default board;
