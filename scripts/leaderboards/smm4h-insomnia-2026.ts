// The organizers rank systems by F1 for overall insomnia detection. Table 3 of the workshop report also gives the scores for identifying supporting evidence.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.smm4h-1.52.pdf";

const board: Leaderboard = {
  benchmark: "smm4h-insomnia-2026", static: 'paper',
  url: "https://www.codabench.org/competitions/15299",
  feed,
  terms: "The public results page gives no separate score license. CodaBench serves HTML for robots.txt. The overview reports the final scores.",
  parts: { 'Label F1': 'Label F1', 'Exact F1': 'Exact F1', 'Partial F1': 'Partial F1' },
  stats: { precision: { name: 'Overall precision', unit: 'score', better: 'higher', note: 'Precision stored from 0 to 1.' }, recall: { name: 'Overall recall', unit: 'score', better: 'higher', note: 'Recall stored from 0 to 1.' } },
  async fetch() {
    const text = await pdfText(feed);
    const section = text.match(/Team\s+Subtask 1\s+Subtask 2\s+System Summary([\s\S]+?)Table 3: System performance/)?.[1] ?? '';
    const rows = [...section.matchAll(/^\s*([^\n]+?)\s{2,}(0\.\d+)\s+([01]\.\d+)\s+([01]\.\d+)\s+([\d.]+|–)\s+([\d.]+|–)\s+([\d.]+|–)\s+/gm)].map(m => {
      const model = m[1].trim();
      const metrics: Record<string, number> = {precision:Number(m[3]), recall:Number(m[4])};
      for (const [i,k] of ['Label F1','Exact F1','Partial F1'].entries()) if (m[5+i] !== '–') metrics[k] = Number(m[5+i]);
      return { model, submitter:model, score:Number(m[2]), metrics };
    });
    if (rows.length < 9) throw new Error('Missing insomnia test standings');
    return rows;
  },
};

export default board;
