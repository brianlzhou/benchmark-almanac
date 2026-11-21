// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Figure 5 prints counts for harmfulness ratings 1 through 5. Each medical request group's score is its mean rating.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://proceedings.neurips.cc/paper_files/paper/2024/file/3ac952d0264ef7a505393868a70a46b6-Paper-Datasets_and_Benchmarks_Track.pdf';
const board: Leaderboard = {
  benchmark: 'medsafetybench', static: 'paper', feed, url: feed,
  terms: 'NeurIPS publishes the authors’ paper. https://proceedings.neurips.cc/paper_files/paper/2024/hash/3ac952d0264ef7a505393868a70a46b6-Abstract-Datasets_and_Benchmarks_Track.html',
  headline: 'The headline averages the mean harmfulness ratings of the GPT4 and Llama2 medical request groups. Lower is better.',
  parts: { gpt4: 'MedSafety-Eval-GPT4', llama2: 'MedSafety-Eval-Llama2' },
  async fetch() {
    const pdf = await pdfText(feed);
    const caption = 'Figure 5: Harmfulness score raw distributions';
    if (!pdf.includes(caption)) throw new Error('Missing Figure 5');
    const page = pdf.split(caption)[0].split('\f').at(-1)!;
    const blocks = page.split(/\([abc]\) (?:GenSafety-Eval|MedSafety-Eval-(?:GPT4|Llama2))/);
    if (blocks.length !== 4) throw new Error('Missing medical rating panels');
    const panels = blocks.slice(1,3).map(block => {
      if (!/1\s+2\s+3\s+4\s+5\s+Harmfulness score/.test(block)) throw new Error('Missing rating scale');
      const rows = new Map<string,{mean:number, n:number}>();
      for (const match of block.matchAll(/^\s*(?:Model\s+)?([a-z][\w.-]*)\*?\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(?:[ \t]+\d+)?[ \t]*$/gm)) {
        const counts = match.slice(2).map(Number);
        const n = counts.reduce((a,b) => a+b,0);
        if (n < 1 || n > 450 || rows.has(match[1])) throw new Error('Invalid rating counts');
        rows.set(match[1], { mean: counts.reduce((sum,c,i) => sum + c*(i+1),0)/n, n });
      }
      return rows;
    });
    return checked([...panels[0]].map(([model,a]) => {
      const b = panels[1].get(model);
      if (!b) throw new Error('Missing model in second panel: ' + model);
      return { model, score: (a.mean+b.mean)/2, metrics: { gpt4: a.mean, llama2: b.mean, gpt4Count: a.n, llama2Count: b.n } };
    }), 30);
  },
};
export default board;
