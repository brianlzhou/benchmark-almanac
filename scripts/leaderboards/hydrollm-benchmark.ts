// HydroLLM tests hydrology questions from articles and a textbook.
// Figures 3 to 6 print six labeled bars each. The first part is article true/false accuracy.
// The other figures report accuracy or cosine similarity, so the importer keeps their scores separate.
import type { Leaderboard, BoardPart } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.cambridge.org/core/services/aop-cambridge-core/content/view/585BFB32C8F14A7C8E8D93F1E0E08020/S263446022510006Xa.pdf/div-class-title-toward-hydrollm-a-benchmark-dataset-for-hydrologyspecific-knowledge-assessment-for-large-language-models-div.pdf';
const formats = ['True/false', 'Multiple choice', 'Fill in the blanks', 'Open ended'];
const models = ['gpt-4o-mini', 'llama3:8b', 'llama3.1:70b'];
const sources = ['Article', 'Textbook'];
const parts: Record<string, BoardPart> = {};
formats.forEach((format, i) => sources.forEach(source => {
  const name = format + ': ' + source;
  parts[name] = { name, unit: i < 2 ? '%' : 'score', note: i < 2 ? 'Accuracy in percent.' : 'Cosine similarity on the figure’s 0 to 100 scale.' };
}));
const board: Leaderboard = {
  benchmark: 'hydrollm-benchmark', static: 'paper', url: 'https://doi.org/10.1017/eds.2025.10006', feed,
  terms: 'Cambridge University Press lists the publication license at https://doi.org/10.1017/eds.2025.10006.',
  parts, headline: 'The paper reports no overall score, so the headline is article true/false accuracy from Figure 3.',
  aliases: { 'llama3:8b': 'llama-3-8b', 'llama3.1:70b': 'llama-3-1-70b' },
  async fetch() {
    const text = await pdfText(feed);
    const rows = models.map(model => ({ model, score: 0, metrics: {} as Record<string, number> }));
    for (const [i, format] of formats.entries()) {
      const caption = new RegExp('Figure ' + (i + 3) + '\\. (?:Accuracy|Cosine similarity) scores for');
      const end = text.search(caption);
      const before = text.slice(0, end);
      const chart = before.split('\n').slice(-35);
      const axisRow = chart.findLastIndex(line => /^\s*0\s*$/.test(line));
      const start = chart.slice(0, axisRow).findLastIndex(line => /^\s*(100|120)\s*$/.test(line) && !line.includes('.'));
      if (end < 0 || start < 0 || axisRow < 0 || !chart.slice(axisRow).some(line => models.every(model => line.includes(model)))) throw new Error('HydroLLM chart labels changed');
      const bars = chart.slice(start, axisRow).flatMap(line => [...line.matchAll(/\b\d+\.\d+\b/g)].map(m => ({ x: m.index!, value: Number(m[0]) }))).sort((a,b) => a.x - b.x);
      if (bars.length !== 6) throw new Error('Expected six HydroLLM bar labels for ' + format);
      rows.forEach((row, m) => sources.forEach((source, s) => {
        const value = bars[m * 2 + s].value;
        row.metrics[format + ': ' + source] = value;
        if (i === 0 && s === 0) row.score = value;
      }));
    }
    return checked(rows, 3);
  },
};
export default board;
