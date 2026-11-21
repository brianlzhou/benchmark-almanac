// HD-EPIC VQA evaluates kitchen-video answers by accuracy. The challenge site links the three winners' reports.
// Read the first two teams' final accuracy and the four named configurations in Ricoh's results table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://hd-epic.github.io/site/";
const board: Leaderboard = {
  benchmark: "hd-epic-vqa",
  url: "https://www.codabench.org/competitions/13645/",
  feed: FEED,
  terms: "The organizers publish the benchmarks under CC BY-NC 4.0. https://hd-epic.github.io/site/#-copyright Codabench serves a challenge page. The organizer links the reports publicly.",
  async fetch() {
    const site = await fetchText(FEED);
    const reports = [...new Set([...site.matchAll(/href="([^"]*\/HD-EPIC-R[123]\.pdf)"/g)].map(m => new URL(m[1], FEED).href))].sort();
    if (reports.length !== 3) throw new Error('Missing HD-EPIC winner reports');
    const rows = [];
    for (const [i, link] of reports.entries()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const paper = await pdfText(link);
      if (i < 2) {
        const match = i === 0 ? paper.match(/curacy of ([\d.]+)% on the challenge/) : paper.match(/([\d.]+)% accuracy on HD-EPIC VQA/);
        if (!match) throw new Error('Missing winner accuracy in ' + link);
        const model = i === 0 ? 'Politecnico di Milano (dav)' : 'Huawei Noah’s Ark Lab (ShaunYoung)';
        rows.push({ model, submitter: model, score: Number(match[1]), link });
      } else {
        const table = paper.split('Average score (%)')[1]?.split('Table 1. Average scores')[0];
        if (!table) throw new Error('Missing Ricoh results');
        const scores = [...table.matchAll(/(Qwen2\.5VL-[\w-]+|LLavaVideo-[\w-]+) +([\d.]+) *$/gm)];
        if (scores.length !== 4) throw new Error('Incomplete Ricoh configurations');
        rows.push(...scores.map(m => ({ model: m[1], submitter: 'Ricoh Software Research Center', setting: 'Zero-shot', score: Number(m[2]), link })));
      }
    }
    return rows;
  },
};
export default board;
