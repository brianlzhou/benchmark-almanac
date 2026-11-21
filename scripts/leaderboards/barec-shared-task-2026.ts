// BAREC ranks Arabic sentence readability systems by quadratic weighted kappa on a 0 to 100 scale.
// Table 7 of the organizers' report lists the track and six additional measures.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2026.arabicnlp-sharedtasks.16.pdf#page=6";
const board: Leaderboard = {
  benchmark: "barec-shared-task-2026", static: 'paper',
  url: "https://aclanthology.org/2026.arabicnlp-sharedtasks.16.pdf#page=6",
  feed: FEED,
  terms: "Table 6 lists ten teams. Table 7 gives track results and three baselines. ZHR has two scored entries. ACL Anthology lists CC BY 4.0. https://aclanthology.org/2026.arabicnlp-sharedtasks.16/ The ACL Anthology robots URL returns HTML.",
  stats: { acc19: { name: 'Accuracy at 19 classes', unit: '%', better: 'higher' }, adjacentAcc19: { name: 'Adjacent accuracy at 19 classes', unit: '%', better: 'higher' }, distance: { name: 'Mean distance', unit: 'score', better: 'lower' }, acc7: { name: 'Accuracy at 7 classes', unit: '%', better: 'higher' }, acc5: { name: 'Accuracy at 5 classes', unit: '%', better: 'higher' }, acc3: { name: 'Accuracy at 3 classes', unit: '%', better: 'higher' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.match(/Team +Track +QWK +Acc19 +±1 Acc19 +Dist +Acc7 +Acc5 +Acc3\n([\s\S]*?)Table 7: Official/);
    if (!table) throw new Error('BAREC Table 7 missing');
    const rows = table[1].trim().split('\n').map(line => {
      const [model, setting] = line.trim().split(/\s{2,}/);
      const values = line.trim().split(/\s{2,}/).slice(2).map(Number);
      if (values.length !== 7 || values.some(v => !Number.isFinite(v))) throw new Error('Invalid BAREC row: ' + line);
      const [score, acc19, adjacentAcc19, distance, acc7, acc5, acc3] = values;
      const team = model.replace(/[†‡§]/g, '');
      return { model: team, submitter: team.startsWith('Baseline ') ? undefined : team, setting, score, metrics: { acc19, adjacentAcc19, distance, acc7, acc5, acc3 } };
    });
    if (rows.length < 14) throw new Error('Missing BAREC entries');
    return rows;
  },
};
export default board;
