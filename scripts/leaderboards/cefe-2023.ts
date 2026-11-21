// CEFE evaluates Chinese essay fluency through identification, correction and rewriting tasks with different scoring rules.
// The first track ranks blind Test B submissions by final micro F1. Section 7.1 of the overview identifies two submitted models.
// Table 3 also reports the organizers' fine-tuned BERT baseline. The other two ranked submissions lack a named model.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/cubenlp/2023CCL_CEFE/main/track1/README.md';
const paper = 'https://aclanthology.org/2023.ccl-3.31.pdf';
const board: Leaderboard = {
  benchmark: 'cefe-2023', url: 'https://github.com/cubenlp/2023CCL_CEFE/tree/main/track1', feed,
  terms: 'The organizers publish the board at https://github.com/cubenlp/2023CCL_CEFE. The paper credits the Chinese Information Processing Society of China.',
  parts: {coarseMicro: 'Coarse-grained micro F1', fineMicro: 'Fine-grained micro F1'},
  async fetch() {
    const text = await fetchText(feed);
    const section = text.split('Track1测试集B排行榜')[1]?.split('2023年6月9日提交结果')[0];
    if (!section?.includes('Final micro f1 | Final macro f1 | Course-grained micro f1 | Fine-grained micro f1')) throw new Error('Missing final Test B table');
    const entrants: Record<string,[string,string]> = {yang:['UTC','ZUT'], Test:['ChatGLM-6B','ihuman']};
    const rows = [];
    for (const line of section.split('\n').filter(l=>l.startsWith('|'))) {
      const [team,,...cells] = line.trim().slice(1,-1).split('|').map(c=>c.trim());
      if (!entrants[team]) continue;
      if (cells.length !== 6 || cells.some(c=>!/^\d+(\.\d+)?$/.test(c))) throw new Error('Invalid Test B result');
      const [score, macroF1, coarseMicro, fineMicro, coarseMacro, fineMacro] = cells.map(Number);
      const [model, submitter] = entrants[team];
      rows.push({model, submitter, setting:'Track 1, Test B', score, metrics:{macroF1, coarseMicro, fineMicro, coarseMacro, fineMacro}});
    }
    const pdf = await pdfText(paper);
    const table = pdf.split('Team Name          Rank     Final Score')[1]?.split('Table 3: Results of Track 1')[0];
    const baseline = table?.match(/Baseline\s+-\s+([\d.]+)\s+B\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/);
    if (!baseline || !pdf.includes('fine-tune BERT')) throw new Error('Missing BERT baseline');
    rows.push({model:'BERT', submitter:'CEFE organizers', setting:'Track 1, Test B', score:+baseline[1], metrics:{coarseMicro:+baseline[2],fineMicro:+baseline[3]}});
    return checked(rows,3);
  },
};
export default board;
