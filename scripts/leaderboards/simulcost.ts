// SimulCost measures success at tuning physics simulations within accuracy targets. Tables 4 and 5 give the authors’ averages across the eleven analytical-cost solvers.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://raw.githubusercontent.com/mlresearch/v306/main/assets/cao26g/cao26g.pdf";
const board: Leaderboard = {
  benchmark: "simulcost", static: 'paper',
  url: "https://github.com/Rose-STL-Lab/SimulCost-Bench/blob/main/eval_results/merged_results.parquet",
  feed: FEED,
  terms: "The repository uses Apache 2.0. The five-model conference comparison covers 11 analytical-cost simulators. The file includes additional experiments. https://github.com/Rose-STL-Lab/SimulCost-Bench/blob/main/LICENSE The host has no published robots directives at /robots.txt.",
  aliases: { 'Llama-3-70B-Instruct': 'llama-3-70b' },
  parts: {"low": {"name": "Low accuracy success", "unit": "%"}, "medium": {"name": "Medium accuracy success", "unit": "%"}, "high": {"name": "High accuracy success", "unit": "%"}, "lowEff": {"name": "Low accuracy efficiency", "unit": "score"}, "mediumEff": {"name": "Medium accuracy efficiency", "unit": "score"}, "highEff": {"name": "High accuracy efficiency", "unit": "score"}, "efficiency": {"name": "Average efficiency", "unit": "score"}},
  async fetch() {
    const pdf = await pdfText(FEED);
    return ['Single-round','Multi-round'].flatMap((setting,index) => {
      const start = 'Table ' + (4 + index) + '. The overall results across the 11 solvers';
      const table = pdf.split(start)[1]?.split(/Table \d+\.|\f/)[0];
      if (!table || !/Low\s+Med\s+High\s+Ave/.test(table)) throw new Error('Missing SimulCost summary');
      const rows = [...table.matchAll(/^\s*(\S+)\s+((?:[\d.]+[ \t]+){7}[\d.]+)[ \t]*$/gm)].map(([,model,values]) => {
        const [low,lowEff,medium,mediumEff,high,highEff,score,efficiency] = values.trim().split(/\s+/).map(Number);
        return { model, setting, score, metrics: { low,lowEff,medium,mediumEff,high,highEff,efficiency } };
      });
      if (rows.length < 5) throw new Error('Missing SimulCost models for ' + setting);
      return rows;
    });
  },
};
export default board;
