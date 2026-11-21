// The shared task tests insomnia detection, rule classification, and extraction of evidence.
// Table 4 ranks teams by binary classification F1 and names their models in the system summaries.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://workshop-proceedings.icwsm.org/pdf/2025_55.pdf';
const board: Leaderboard = {
  benchmark: 'smm4h-insomnia-2025', static: 'paper', url: 'https://workshop-proceedings.icwsm.org/abstract.php?id=2025_55', feed,
  terms: 'The paper credits copyright to AAAI. ' + feed,
  headline: 'The organizers report three separate tasks and rank the table by binary classification F1.',
  parts: {rules: 'Subtask 2A F1', evidence: 'Subtask 2B ROUGE-L F1'},
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 4: System summaries')[0].split('Table 3: System summaries').at(-1);
    if (!table?.includes('Subtask 2B') || !table.includes('R-L F1')) throw new Error('Missing insomnia results');
    const rows: LeaderboardRow[] = [];
    const fields = ['f1','precision','recall','rules','rulesPrecision','rulesRecall','evidence','evidencePrecision','evidenceRecall'];
    for (const match of table.matchAll(/^\s*([\w -]+?)\s{2,}((?:(?:\d\.\d{3}|-)\s+){9})([^,\n]+)/gm)) {
      const [,team,cells,firstModel] = match;
      const metrics: Record<string,number> = {};
      cells.trim().split(/\s+/).forEach((value,i) => { if (value !== '-') metrics[fields[i]] = Number(value); });
      const {f1: score, ...other} = metrics;
      const submitter = team.trim();
      const row: LeaderboardRow = {model: firstModel.trim(), submitter, score, metrics: other};
      if (submitter === 'IAI') row.models = [row.model, 'Clinical BigBird', 'SciBERT'];
      if (submitter === 'SRMISTNLPInsomnia') row.models = [row.model, 'ClinicalBERT'];
      if (submitter === 'LLM Pros' || submitter === 'HaleLab NITK') row.setting = 'Zero-shot';
      rows.push(row);
    }
    return checked(rows, 7);
  },
};
export default board;
