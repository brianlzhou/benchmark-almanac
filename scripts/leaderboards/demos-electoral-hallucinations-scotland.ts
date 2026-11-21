// Demos reports the percentage of election answers judged entirely accurate. Table 8 gives the headline score.
// Tables 11 to 13 give accuracy for factual questions, citation rates and guardrail rates.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://demos.co.uk/wp-content/uploads/2026/05/Electoral-Hallucinations_Report_2026.ac_.pdf";
const board: Leaderboard = {
  benchmark: 'demos-electoral-hallucinations-scotland', static: 'paper',
  url: "https://demos.co.uk/wp-content/uploads/2026/05/Electoral-Hallucinations_Report_2026.ac_.pdf",
  feed,
  terms: "Demos allows the report path in robots.txt. Demos publishes the report under CC BY-SA 3.0. Table 8 gives the results for all questions. https://demos.co.uk/wp-content/uploads/2026/05/Electoral-Hallucinations_Report_2026.ac_.pdf",
  stats: {
    partial: { name: 'Partly accurate but with errors (all questions)', unit: '%' },
    inaccurate: { name: 'Entirely inaccurate (all questions)', unit: '%' },
    unverifiable: { name: 'Unverifiable (all questions)', unit: '%' },
    factualPartial: { name: 'Partly accurate but with errors', unit: '%' },
    factualInaccurate: { name: 'Entirely inaccurate', unit: '%' },
    factualUnverifiable: { name: 'Unverifiable', unit: '%' },
    citations: { name: 'Citations given', unit: '%' },
    noCitations: { name: 'No citations given', unit: '%' },
    official: { name: 'Official sources given', unit: '%' },
    noOfficial: { name: 'No official sources given', unit: '%' },
    directedToOfficial: { name: 'Directed to official sources', unit: '%' },
    biasWarning: { name: 'Warned against political bias', unit: '%' },
    falseInfoWarning: { name: 'Warned against generating or spreading false information', unit: '%' },
    falseInfoRefusal: { name: 'Refused to generate false information', unit: '%' },
    incompleteAnswer: { name: 'Would not answer fully', unit: '%' },
    noAnswer: { name: 'Would not answer at all', unit: '%' },
  },
  parts: { factual: 'Factual questions' },
  async fetch() {
    const source = await pdfText(feed);
    const records = new Map<string, Record<string, number>>();
    for (const [id, keys] of [
      [8, ['score','partial','inaccurate','unverifiable']],
      [11, ['factual','factualPartial','factualInaccurate','factualUnverifiable']],
      [12, ['citations','noCitations','official','noOfficial']],
      [13, ['directedToOfficial','biasWarning','falseInfoWarning','falseInfoRefusal','incompleteAnswer','noAnswer']],
    ] as const) {
      const table = source.split('TABLE ' + id + '\n')[1]?.split(/(?:TABLE \d+\n|Licence to publish)/)[0];
      if (!table) throw new Error('Missing Demos Table ' + id);
      let count = 0;
      for (const m of table.matchAll(/^\s*(ChatGPT|Google Gemini|Google AI|Grok|Replika)\s+((?:(?:[\d.]+%|N\/A)[ \t]*)+)$/gm)) {
        const model = m[1] === 'Google AI' ? 'Google AI Overview' : m[1];
        const values = m[2].trim().split(/\s+/);
        if (values.length !== keys.length) throw new Error('Incomplete Demos row for ' + model);
        const metrics = records.get(model) ?? {};
        keys.forEach((key,i) => { if (values[i] !== 'N/A') metrics[key] = Number(values[i].replace('%','')); });
        records.set(model, metrics);
        count++;
      }
      if (count !== 5) throw new Error('Expected five services in Demos Table ' + id);
    }
    return [...records].map(([model, {score, ...metrics}]) => ({ model, score, metrics }));
  },
};
export default board;
