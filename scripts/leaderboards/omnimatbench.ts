// OmniMatBench tests materials reasoning across 19 subfields. Table 3 reports overall performance across rubric-scored
// answers and calculation slots. Tables 4, 7, 8, and 10 identify the components, subfields, and reference prices.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.29833';
const board: Leaderboard = {
  benchmark: 'omnimatbench', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2605.29833.',
  parts: {
    cal: { name: 'CAL slot accuracy', group: 'Component' },
    qa: { name: 'QA macro F1', group: 'Component' },
    subfield1: { name: 'Materials Science and Engineering', group: 'Fundamental Materials Science' },
    subfield2: { name: 'Soft Matter Science and Engineering', group: 'Fundamental Materials Science' },
    subfield3: { name: 'Materials Physics', group: 'Fundamental Materials Science' },
    subfield4: { name: 'Materials Chemistry', group: 'Fundamental Materials Science' },
    subfield5: { name: 'Materials Design Science and Engineering', group: 'Fundamental Materials Science' },
    subfield6: { name: 'Polymer Materials', group: 'Structural and Engineering Materials' },
    subfield7: { name: 'Composite Materials', group: 'Structural and Engineering Materials' },
    subfield8: { name: 'Powder Materials', group: 'Structural and Engineering Materials' },
    subfield9: { name: 'Gem Materials and Gemology', group: 'Structural and Engineering Materials' },
    subfield10: { name: 'Metallurgical Engineering', group: 'Materials Processing and Manufacturing' },
    subfield11: { name: 'Welding Technology and Engineering', group: 'Materials Processing and Manufacturing' },
    subfield12: { name: 'Intelligent Materials and Structures', group: 'Materials Processing and Manufacturing' },
    subfield13: { name: 'New Energy Materials and Devices', group: 'Materials Processing and Manufacturing' },
    subfield14: { name: 'Metallic Materials', group: 'Materials Processing and Manufacturing' },
    subfield15: { name: 'Inorganic Non-metallic Materials', group: 'Materials Processing and Manufacturing' },
    subfield16: { name: 'Functional Materials', group: 'Functional and Applied Materials' },
    subfield17: { name: 'Electronic Information Materials', group: 'Functional and Applied Materials' },
    subfield18: { name: 'Nanomaterials and Technology', group: 'Functional and Applied Materials' },
    subfield19: { name: 'Composite Materials Molding', group: 'Functional and Applied Materials' },
  },
  stats: {
    subfield1Cal: { name: 'Materials Science and Engineering calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield2Cal: { name: 'Soft Matter Science and Engineering slot accuracy', unit: 'score', better: 'higher', note: 'Calculation slot accuracy, stored from 0 to 1.' },
    subfield3Cal: { name: 'Materials Physics calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield4Cal: { name: 'Materials Chemistry calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield5Cal: { name: 'Materials Design Science and Engineering slot accuracy', unit: 'score', better: 'higher', note: 'Calculation slot accuracy, stored from 0 to 1.' },
    subfield6Cal: { name: 'Polymer Materials calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield7Cal: { name: 'Composite Materials calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield8Cal: { name: 'Powder Materials calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield9Cal: { name: 'Gem Materials and Gemology calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield10Cal: { name: 'Metallurgical Engineering calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield11Cal: { name: 'Welding Technology and Engineering calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield12Cal: { name: 'Intelligent Materials and Structures slot accuracy', unit: 'score', better: 'higher', note: 'Calculation slot accuracy, stored from 0 to 1.' },
    subfield13Cal: { name: 'New Energy Materials and Devices calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield14Cal: { name: 'Metallic Materials calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield15Cal: { name: 'Inorganic Non-metallic Materials calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield16Cal: { name: 'Functional Materials calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield17Cal: { name: 'Electronic Information Materials calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield18Cal: { name: 'Nanomaterials and Technology calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    subfield19Cal: { name: 'Composite Materials Molding calculation slot accuracy', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    FMSP: { name: 'Fundamental Materials Science Precision', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    FMSR: { name: 'Fundamental Materials Science Recall', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    FMSF1: { name: 'Fundamental Materials Science F1 score', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    SEMP: { name: 'Structural and Engineering Materials Precision', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    SEMR: { name: 'Structural and Engineering Materials Recall', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    SEMF1: { name: 'Structural and Engineering Materials F1 score', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    MPMP: { name: 'Materials Processing and Manufacturing Precision', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    MPMR: { name: 'Materials Processing and Manufacturing Recall', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    MPMF1: { name: 'Materials Processing and Manufacturing F1 score', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    FAMP: { name: 'Functional and Applied Materials Precision', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    FAMR: { name: 'Functional and Applied Materials Recall', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    FAMF1: { name: 'Functional and Applied Materials F1 score', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    OverallP: { name: 'Overall Precision', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    OverallR: { name: 'Overall Recall', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    OverallF1: { name: 'Overall F1 score', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    priceIn: { name: 'Input price', unit: 'usd-per-mtok' },
    priceOut: { name: 'Output price', unit: 'usd-per-mtok' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.at(-1) === 'Avg. score');
    const cal = tables.find(t => t[1]?.length === 21 && t[1].at(-1) === 'Avg.');
    const qa = tables.find(t => t[0]?.[1] === 'FMS' && t[1]?.at(-1) === 'F1');
    const labels = tables.find(t => t[0]?.join('|') === 'ID|Category|QA|CAL|Total');
    const prices = tables.find(t => t[0]?.join('|') === 'Model|Input|Output');
    if (!main || !cal || !qa || !labels || !prices) throw new Error('Missing OmniMatBench comparison');
    const rows: LeaderboardRow[] = main.slice(2).map(r => {
      const model = r[0], calc = cal.find(x => x[0] === model), answer = qa.find(x => x[0] === model);
      if (!calc || !answer || r.length !== 21) throw new Error('Missing component for ' + model);
      const metrics: Record<string,number> = {cal: numberCell(calc[20]), qa: numberCell(answer[15])};
      board.parts!.cal = 'CAL slot accuracy';
      board.parts!.qa = 'QA macro F1';
      for (let j = 1; j <= 19; j++) {
        const name = labels.find(x => x[0] === main[1][j])?.[1];
        if (!name || cal[1][j] !== main[1][j]) throw new Error('Missing subfield ' + j);
        const key = 'subfield' + j;
        board.parts![key] = {name, group: main[0][j]};
        metrics[key] = numberCell(r[j]);
        metrics[key + 'Cal'] = numberCell(calc[j]);
      }
      for (let j = 1; j < answer.length; j++) metrics[qa[0][j] + qa[1][j]] = numberCell(answer[j]);
      const price = prices.find(x => x[0] === model);
      if (price) {
        metrics.priceIn = numberCell(price[1]);
        metrics.priceOut = numberCell(price[2]);
      }
      return {model, score: numberCell(r[20]), metrics};
    });
    return checked(rows, 13);
  },
};
export default board;
