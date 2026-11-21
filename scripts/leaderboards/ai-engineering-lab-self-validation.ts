// AI Engineering Lab tests whether agents recognize invalid simulations. Table 5 in the authors' paper gives the F1 score for each validation model.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://assets-eu.researchsquare.com/files/rs-6566994/v1_covered_f5f7a678-a71f-42b2-a658-55d5c482acd9.pdf";

const board: Leaderboard = {
  benchmark: "ai-engineering-lab-self-validation", static: 'paper',
  url: "https://github.com/jgerstmayr/AI-engineering-lab/tree/main/logsAgent",
  feed: FEED,
  terms: "The repository uses BSD 3-Clause. https://github.com/jgerstmayr/AI-engineering-lab/blob/main/LICENSE GitHub requests a one-second crawl delay. Table 5 is credited to the authors.",
  aliases: { 'Phi4-Q4': 'phi-4', 'Llama3.1-70B-HF': 'llama-3-1-70b', 'Qwen2.5-32B-Q4': 'qwen2-5-32b', 'Qwen2.5-72B-HF': 'qwen2-5-72b' },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split('Table 5: Overview on final results')[1]?.split('The metric B')[0];
    if (!table?.includes('F1-score') || !table.includes('fails threshold')) throw new Error('Missing Table 5 columns');
    const rows = table.split(/LLM name[^\n]*\n/).at(-1)!.trim().split(/\r?\n/).filter((line) => line.trim()).map((line) => {
      const [model, ...cells] = line.trim().split(/\s+/);
      const values = cells.map(Number);
      if (values.length !== 13 || !values.every(Number.isFinite)) throw new Error(`Unexpected Table 5 row: ${line}`);
      const [runtimeMinutes, tokensK, tokensPerSecond, correctCases, threshold, score, fpr, tpr, tp, fn, fp, tn, undecidable] = values;
      return { model, score, setting: `Fails threshold ${threshold}`,
        metrics: { runtimeMinutes, totalGeneratedTokens: tokensK * 1000, tokensPerSecond, correctCases, fpr, tpr, tp, fn, fp, tn, undecidable } };
    });
    if (rows.length < 8) throw new Error('Expected eight validation models');
    return rows;
  },
};
export default board;
