// MultiMedQA combines medical multiple-choice exams and human-rated long answers.
// Tables 5 through 7 report MedQA accuracy first. Table A.1 gives MMLU subject results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2212.13138';
const board: Leaderboard = {
  benchmark: 'multimedqa', url: feed, feed, static: 'paper',
  terms: 'The authors publish the benchmark and these results at https://arxiv.org/abs/2212.13138.',
  headline: 'The paper reports no overall score, so the headline is accuracy on the four-option MedQA exam, the first dataset in its comparison.',
  parts: {medqa: {name: 'MedQA (4 options)', unit: '%'}, medmcqa: {name: 'MedMCQA', unit: '%'}, pubmedqa: {name: 'PubMedQA', unit: '%'}},
  stats: {
    Clinicalknowledge: {name: 'Clinical knowledge', unit: '%', better: 'higher'},
    Medicalgenetics: {name: 'Medical genetics', unit: '%', better: 'higher'},
    Anatomy: {name: 'Anatomy', unit: '%', better: 'higher'},
    Professionalmedicine: {name: 'Professional medicine', unit: '%', better: 'higher'},
    Collegebiology: {name: 'College biology', unit: '%', better: 'higher'},
    Collegemedicine: {name: 'College medicine', unit: '%', better: 'higher'},
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const rows: LeaderboardRow[] = [];
    const main = tables.filter(t => t[0]?.[0] === 'Dataset' && t[1]?.[0].includes('MedQA 4 options'));
    if (main.length !== 3) throw new Error('Missing MultiMedQA comparison tables');
    for (const [i, t] of main.entries()) {
      if (!t[2]?.[0].startsWith('MedMCQA') || !t[3]?.[0].startsWith('PubMedQA')) throw new Error('Changed dataset columns');
      for (let col = i ? 2 : 1; col < t[0].length; col++) {
        const [model, mode] = t[0][col].split(' with ');
        const parameterMatch = model.match(/(?:\(|\s)(\d+(?:\.\d+)?)\s*([BM])\b/i);
        const params = parameterMatch ? Number(parameterMatch[1]) * (parameterMatch[2].toUpperCase() === 'M' ? 0.001 : 1) : undefined;
        const setting = mode ?? 'few-shot';
        const [medqa, medmcqa, pubmedqa] = t.slice(1).map(r => numberCell(r[col]));
        rows.push({model, setting, score: medqa, ...(params === undefined ? {} : {params}), metrics: {medqa, medmcqa, pubmedqa}});
      }
    }
    const mmlu = tables.find(t => t[0]?.[0] === 'Topic' && t[1]?.[0] === 'Clinical knowledge');
    if (!mmlu || mmlu.length !== 7) throw new Error('Missing MMLU clinical subjects');
    for (const row of rows) {
      const col = mmlu[0].indexOf(row.model + ' with ' + row.setting);
      if (col === -1) continue;
      for (const r of mmlu.slice(1)) {
        const key = r[0].replaceAll(' ', '');
        board.parts![key] = {name: r[0], group: 'MMLU', unit: '%'};
        row.metrics![key] = numberCell(r[col]);
      }
    }
    return checked(rows, 8);
  },
};
export default board;
