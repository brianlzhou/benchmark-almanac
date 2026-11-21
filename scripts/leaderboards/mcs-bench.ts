// MCS-Bench measures multimodal understanding of Chinese classical studies. The authors' results
// table reports the overall score and splits by domain and question format. The appendix gives task scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = "https://aclanthology.org/2025.acl-long.515.pdf";
const board: Leaderboard = {
  benchmark: 'mcs-bench', static: 'paper',
  url: "https://github.com/SCUT-DLVCLab/MCS-Bench#evaluation-metrics",
  feed,
  terms: "GitHub robots.txt directs automated readers to its API. The authors specify MIT for their work and separate noncommercial terms for the dataset.",
  async fetch() {
    const paper = await pdfText(feed);
    const main = paper.split(/Model\s+OverAll\s+Rank/)[1]?.split(/\n\s*Average\s/)[0];
    if (!main?.includes('Oracle Bone Script')) throw new Error('Missing MCS leaderboard');
    const names = ['Ancient Chinese Text', 'Calligraphy', 'Painting', 'Oracle Bone Script', 'Seal', 'Cultural Relic', 'Illustration', 'MCQ', 'QA'];
    board.parts = Object.fromEntries(names.map(name => [name, name]));
    const rows = new Map<string, LeaderboardRow>();
    let open = false;
    for (const line of main.split('\n')) {
      if (line.includes('Open-source Models')) open = true;
      const [model, score, rank, ...values] = line.trim().split(/\s+/);
      if (!/^\d+$/.test(rank)) continue;
      if (values.length !== names.length || ![score, ...values].every(v => Number.isFinite(Number(v)))) throw new Error('Invalid MCS row');
      rows.set(model, { model, score: Number(score), open, metrics: Object.fromEntries(names.map((name, i) => [name, Number(values[i])])) });
    }
    if (rows.size !== 37) throw new Error('Missing MCS models');
    for (const match of paper.matchAll(/\fModel\s+((?:T\d+\s+)+)MCQ\s+QA\s+OverAll([^\f]+)/g)) {
      const keys = match[1].trim().split(/\s+/);
      for (const line of match[2].split('\n')) {
        const [model, ...values] = line.trim().split(/\s+/), row = rows.get(model);
        if (!row) continue;
        keys.forEach((key, i) => {
          if (!Number.isFinite(Number(values[i]))) throw new Error('Invalid MCS task value');
          row.metrics![key] = Number(values[i]);
          board.parts![key] = { name: key, group: 'Task' };
        });
      }
    }
    if ([...rows.values()].some(row => Object.keys(row.metrics!).length !== 54)) throw new Error('Incomplete MCS task scores');
    return [...rows.values()];
  },
};
export default board;
