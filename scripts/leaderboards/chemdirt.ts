// ChemDIRT evaluates molecular reasoning under different instructions and representations.
// Tables IV through VI mix accuracy, similarity and regression errors. The first measure is exact match on IUPAC-to-SMILES translation.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2608.21504';
const parts: Record<string, BoardPart> = {};
const sourceParts: Array<[string, string, '%' | 'score', 'higher' | 'lower' | undefined]> = [
  ['IUPAC to SMILES', 'Exact Match', '%', 'higher'], ['IUPAC to SMILES', 'MACCS', 'score', 'higher'], ['IUPAC to SMILES', 'Morgan', 'score', 'higher'], ['IUPAC to SMILES', 'RDK', 'score', 'higher'],
  ['SMILES to IUPAC', 'Structural EM', '%', 'higher'], ['SMILES to IUPAC', 'IUPAC EM', '%', 'higher'], ['SMILES to IUPAC', 'MACCS', 'score', 'higher'], ['SMILES to IUPAC', 'Morgan', 'score', 'higher'], ['SMILES to IUPAC', 'RDK', 'score', 'higher'],
  ['BACE', 'Accuracy', '%', 'higher'], ['BBBP', 'Accuracy', '%', 'higher'], ['ClinTox', 'Accuracy', '%', 'higher'], ['HIV', 'Accuracy', '%', 'higher'], ['Coefficient Balancing', 'Accuracy', '%', 'higher'],
  ['ESOL', 'Log RMSE', 'score', 'lower'], ['ESOL', 'MAE', 'score', 'lower'], ['ESOL', 'Relative RMSE', 'score', 'lower'], ['ESOL', 'RMSE', 'score', 'lower'],
  ['Lipophilicity', 'Log RMSE', 'score', 'lower'], ['Lipophilicity', 'MAE', 'score', 'lower'], ['Lipophilicity', 'Relative RMSE', 'score', 'lower'], ['Lipophilicity', 'RMSE', 'score', 'lower'],
  ['FreeSolv', 'Log RMSE', 'score', 'lower'], ['FreeSolv', 'MAE', 'score', 'lower'], ['FreeSolv', 'Relative RMSE', 'score', 'lower'], ['FreeSolv', 'RMSE', 'score', 'lower'],
  ['O2 Permeability', 'Log RMSE', 'score', 'lower'], ['O2 Permeability', 'MAE', 'score', 'lower'], ['O2 Permeability', 'Relative RMSE', 'score', 'lower'], ['O2 Permeability', 'RMSE', 'score', 'lower'],
  ['Forward SMILES', 'Exact Match', '%', 'higher'], ['Forward SMILES', 'MACCS', 'score', 'higher'], ['Forward SMILES', 'Morgan', 'score', 'higher'], ['Forward SMILES', 'RDK', 'score', 'higher'],
  ['Forward Formula', 'Exact Match', '%', 'higher'], ['Forward Formula', 'Atom Cosine', 'score', 'higher'], ['Forward Formula', 'Atom F1', 'score', 'higher'],
  ['Retrosynthesis SMILES', 'Exact Match', '%', 'higher'], ['Retrosynthesis SMILES', 'MACCS', 'score', 'higher'], ['Retrosynthesis SMILES', 'Morgan', 'score', 'higher'], ['Retrosynthesis SMILES', 'RDK', 'score', 'higher'],
  ['Retrosynthesis Formula', 'Exact Match', '%', 'higher'], ['Retrosynthesis Formula', 'Atom Cosine', 'score', 'higher'], ['Retrosynthesis Formula', 'Atom F1', 'score', 'higher'],
  ['Description', 'Accuracy Carbon', '%', 'higher'], ['Description', 'Accuracy Ring', '%', 'higher'], ['Description', 'Accuracy Functional Group', '%', 'higher'], ['Description', 'Accuracy Bond Type', '%', 'higher'],
  ['Relational', 'Accuracy Rep Equiv', '%', 'higher'], ['Relational', 'Accuracy Chem Sim', '%', 'higher'], ['Relational', 'Accuracy Weight Comp', '%', 'higher'],
  ['Molecular Weight Calculation', 'Log RMSE', 'score', 'lower'], ['Molecular Weight Calculation', 'MAE', 'score', 'lower'], ['Molecular Weight Calculation', 'Relative RMSE', 'score', 'lower'], ['Molecular Weight Calculation', 'RMSE', 'score', 'lower'],
  ['Description Based Design', 'Exact Match', '%', 'higher'], ['Description Based Design', 'MACCS', 'score', 'higher'], ['Description Based Design', 'Morgan', 'score', 'higher'], ['Description Based Design', 'RDK', 'score', 'higher'],
  ['Open Response', 'Exact Match', '%', 'higher'], ['Open Response', 'ROUGE1', 'score', 'higher'], ['Open Response', 'ROUGE2', 'score', 'higher'], ['Open Response', 'ROUGEL', 'score', 'higher'],
  ['True/False', 'Accuracy', '%', 'higher'], ['Literature Grounded QA', 'Exact Match', '%', 'higher'], ['Literature Grounded QA', 'ROUGE1', 'score', 'higher'], ['Literature Grounded QA', 'ROUGE2', 'score', 'higher'], ['Literature Grounded QA', 'ROUGEL', 'score', 'higher'],
  ['Physical Unit Calculation', 'Log RMSE', 'score', 'lower'], ['Physical Unit Calculation', 'MAE', 'score', 'lower'], ['Physical Unit Calculation', 'Relative RMSE', 'score', 'lower'], ['Physical Unit Calculation', 'RMSE', 'score', 'lower'],
  ['Yield Prediction', 'Log RMSE', 'score', 'lower'], ['Yield Prediction', 'MAE', 'score', 'lower'], ['Yield Prediction', 'Relative RMSE', 'score', 'lower'], ['Yield Prediction', 'RMSE', 'score', 'lower'],
  ['Image to SMILES', 'Exact Match', '%', 'higher'], ['Image to SMILES', 'MACCS', 'score', 'higher'], ['Image to SMILES', 'Morgan', 'score', 'higher'], ['Image to SMILES', 'RDK', 'score', 'higher'],
  ['Image to IUPAC', 'Exact Match', '%', 'higher'], ['Image to IUPAC', 'MACCS', 'score', 'higher'], ['Image to IUPAC', 'Morgan', 'score', 'higher'], ['Image to IUPAC', 'RDK', 'score', 'higher'],
  ['Forward Prediction Image', 'Exact Match', '%', 'higher'], ['Forward Prediction Image', 'MACCS', 'score', 'higher'], ['Forward Prediction Image', 'Morgan', 'score', 'higher'], ['Forward Prediction Image', 'RDK', 'score', 'higher'],
  ['Retrosynthesis Image', 'Exact Match', '%', 'higher'], ['Retrosynthesis Image', 'MACCS', 'score', 'higher'], ['Retrosynthesis Image', 'Morgan', 'score', 'higher'], ['Retrosynthesis Image', 'RDK', 'score', 'higher'],
];
for (const [group, label, unit, better] of sourceParts) {
  const key = (group + label).replace(/[^a-zA-Z0-9]/g, '');
  parts[key] = { name: `${group}: ${label}`, group, unit, ...(better ? { better } : {}) };
}
function number(s: string) {
  const normalized = s.trim().replace(/\\!|\\,/g, '').replace(/\\times\s*10\^\{(-?\d+)\}/, 'e$1');
  if (!normalized || !Number.isFinite(Number(normalized))) throw new Error('Invalid reported metric: ' + s);
  return Number(normalized);
}
const board: Leaderboard = {
  benchmark: 'chemdirt', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish the benchmark results on arXiv. https://arxiv.org/abs/2608.21504',
  headline: 'The paper gives no overall score, so the headline uses its first measure, exact match for IUPAC-to-SMILES translation.',
  aliases: { Gemma2: 'gemma-2-9b', Gemma3: 'gemma-3-4b', Llama2: 'llama-2-7b', Qwen2: 'qwen2-7b-instruct', Qwen3: 'qwen3-8b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = [...html.matchAll(/<figure id="S3.T[456]"[\s\S]*?<\/figure>/g)].flatMap(f => inlinePaperTables(f[0]));
    if (tables.length !== 9 || !tables[0][0][1].startsWith('IUPAC') || tables[0][1][1] !== 'Exact Match') throw new Error('ChemDIRT result panels changed');
    const rows = new Map<string, LeaderboardRow>();
    for (const [index, table] of tables.entries()) {
      for (const [raw, ...cells] of table.slice(2)) {
        const model = raw.split(' [')[0];
        if (index === 0 && cells[0] !== 'Unable to complete') rows.set(model, { model, score: NaN, metrics: {} });
        const row = rows.get(model);
        if (!row) continue;
        cells.forEach((cell, i) => {
          if (cell === 'Unable to complete' || cell === '–') return;
          const group = table[0][i+1].replace(/\s*\( n=.*$/, '').replace('\\rightarrow', 'to');
          const label = table[1][i+1];
          const key = (group + label).replace(/[^a-zA-Z0-9]/g, '');
          const error = /RMSE|MAE/.test(label);
          const percent = /Accuracy|Exact Match| EM$/.test(label) || group.includes('Accuracy');
          parts[key] = { name: group + ': ' + label, group, unit: percent ? '%' : 'score', ...(error ? { better: 'lower' } : {}) };
          const [value, sd] = cell.split('\\pm').map(number);
          const scale = percent ? 100 : 1;
          row.metrics![key] = value * scale;
          if (sd !== undefined) row.metrics![key + 'Std'] = sd * scale;
          if (index === 0 && i === 0) {
            row.score = value * scale;
            row.metrics!.std = sd * scale;
          }
        });
      }
    }
    return checked([...rows.values()], 21);
  },
};
export default board;
