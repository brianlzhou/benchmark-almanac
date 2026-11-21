// The source reports no overall score. The headline is the plain mean of the five parts, computed by this importer.
// MedLFQA tests long-form medical answers. The authors identify factuality as their primary focus in Appendix A.
// Tables 2 and 3 give factuality, semantic similarity and words composition. Tables 8 and 9 break them down.
// Table 2 reports zero-shot scores and changes after one Olaph training step. The repository lists the base checkpoints.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2405.12701';
const datasets = ['LiveQA', 'MedicationQA', 'HealthSearchQA', 'K-QA Golden', 'K-QA Silver'];
const measures = ['Words Composition', 'Semantic Similarity', 'Factuality'];
const board: Leaderboard = {
  benchmark: 'medlfqa', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  headline: 'The headline averages factuality, the paper’s primary focus, equally across its five datasets.',
  aliases: { LLaMA2: 'llama-2-7b', Mistral: 'mistral-7b-v0-1' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(url)).map(grid);
    const parts: Record<string, BoardPart> = {};
    const rows: LeaderboardRow[] = [];
    for (const group of ['Open LM (+ Olaph Step-1)', 'Proprietary LLMs']) {
      const main = tables.find(t => t[0]?.[2] === group && t[0][0] === 'MedLFQA Dataset');
      if (!main) throw new Error('Missing ' + group);
      const open = group.startsWith('Open');
      for (const trained of open ? [false, true] : [false]) {
        const detail = open && tables.find(t => t[0]?.[2] === (trained ? 'Open LM ( Olaph Step-1)' : 'Open LM') && t[2]?.[1] === 'R1 / R2 / RL');
        if (open && !detail) throw new Error('Missing fine-grained metrics');
        for (const [index, model] of main[1].slice(2).entries()) {
          const col = index + 2;
          const metrics: Record<string, number> = {};
          let total = 0;
          for (const dataset of datasets) {
            for (const measure of measures) {
              const cell = main.find(r => r[0] === dataset && r[1] === measure)?.[col];
              const match = cell?.match(/^(-?[\d.]+)(?: \(([+-][\d.]+)\))?$/);
              if (!match || (open && !match[2])) throw new Error('Invalid score for ' + model);
              const value = Number((numberCell(match[1]) + (trained ? Number(match[2]) : 0)).toFixed(2));
              const key = dataset + ' ' + measure;
              metrics[key] = value;
              parts[key] = {name: measure, group: dataset, unit: 'score'};
              if (measure === 'Factuality') total += value;
            }
            if (detail) {
              const detailCol = detail[1].indexOf(model);
              for (const header of ['R1 / R2 / RL', 'BL / BS', 'HL / CP']) {
                const values = detail.find(r => r[0] === dataset && r[1] === header)?.[detailCol]?.split(' / ');
                const labels = header.split(' / ');
                if (values?.length !== labels.length) throw new Error('Invalid ' + header);
                labels.forEach((label, i) => {
                  const key = dataset + ' ' + label;
                  metrics[key] = numberCell(values[i]);
                  parts[key] = {name: label, group: dataset, unit: 'score', better: label === 'HL' ? 'lower' : 'higher'};
                });
              }
            }
          }
          rows.push({model, setting: trained ? 'Zero-shot, Olaph step 1' : 'Zero-shot', score: Number((total / datasets.length).toFixed(3)), metrics});
        }
      }
    }
    board.parts = parts;
    return checked(rows, 13);
  },
};
export default board;
