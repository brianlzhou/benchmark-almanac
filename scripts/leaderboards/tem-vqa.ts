// TEM-VQA compares answers about electron micrographs. Read Answer Word Coverage, the paper's headline VQA result, and the other three VQA metrics from the results table.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { markdownTables } from "../lib/boards/github-markdown.ts";
const board: Leaderboard = {
  benchmark: "tem-vqa",
  url: "https://github.com/SemiMIRTLab/ATOMIC#results",
  feed: "https://raw.githubusercontent.com/SemiMIRTLab/ATOMIC/59d850598aaaeece8c172a8bf683835c590919c8/README.md",
  terms: "The repository has an Apache 2.0 license. The authors distribute figure reconstruction metadata and identify publisher terms for the source images. https://github.com/SemiMIRTLab/ATOMIC/blob/main/LICENSE The raw GitHub host returned 404 for robots.txt.",
  stats: {
    bleu1: { name: "BLEU-1", unit: "%", better: "higher" },
    rougeL: { name: "ROUGE-L", unit: "%", better: "higher" },
    meteor: { name: "METEOR", unit: "%", better: "higher" },
  },
  async fetch() {
    const t = markdownTables(await fetchText(this.feed)).find(t => t[0].includes('AWC'));
    if (!t || t.length < 12 || t[0].join('|') !== 'Model|BLEU-1|ROUGE-L|METEOR|AWC|MCQ Accuracy') throw new Error('Missing TEM-VQA ranking');
    return t.slice(1).map(r=>{
      const [bleu1,rougeL,meteor,score]=r.slice(1,5).map(x=>x.trim()?Number(x):NaN);
      if (![bleu1,rougeL,meteor,score].every(Number.isFinite)) throw new Error('Invalid TEM-VQA result');
      return {model:r[0].replace(/†$/,''),score,metrics:{bleu1,rougeL,meteor}};
    });
  },
};
export default board;
