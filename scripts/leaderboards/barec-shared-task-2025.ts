// BAREC ranks strict sentence-level submissions by quadratic weighted kappa.
// Table 11 of the organizers' paper reports the scores and marks teams that trained on development data.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2025.arabicnlp-sharedtasks.34.pdf#page=13";
const board: Leaderboard = {
  benchmark: "barec-shared-task-2025", static: 'paper',
  url: "https://aclanthology.org/2025.arabicnlp-sharedtasks.34.pdf#page=13",
  feed,
  terms: "Table 11 ranks 16 strict sentence systems. The organizers flag two entrants that trained on development data. ACL Anthology lists CC BY 4.0. ACL Anthology returned 404 for robots.txt.",
  async fetch() {
    const source = await pdfText(feed);
    const caption = 'Table 11: Performance of participating teams in the strict track in the sentence-level task.';
    const end = source.indexOf(caption);
    const start = source.lastIndexOf('Team ', end);
    const lines = source.slice(start, end).trim().split(/\r?\n/);
    if (end < 0 || lines.shift()?.trim().replace(/\s+/g, ' ') !== 'Team QWK Acc19 ±1 Acc19 Dist Acc7 Acc5 Acc3' || lines.length < 16) throw new Error('Missing strict sentence table');
    return lines.map(line => {
      const [label, ...cells] = line.trim().split(/\s+/);
      if (cells.length !== 7 || cells.some(c => !Number.isFinite(Number(c)))) throw new Error('Invalid BAREC result');
      const [score, acc19, withinOne, distance, acc7, acc5, acc3] = cells.map(Number);
      const model = label.replace(/∗$/, '');
      return { model, submitter: model, score, setting: label.endsWith('∗') ? 'Strict sentence, trained on development data' : 'Strict sentence',
        metrics: { acc19, withinOne, distance, acc7, acc5, acc3 } };
    });
  },
};
export default board;
