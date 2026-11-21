// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// NitiBench evaluates Thai legal answers. Section 3.2.2 defines coverage on a 0 to 100 scale.
// Table 3 reports coverage, contradiction, retrieval recall and citation metrics for each dataset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://aclanthology.org/2025.emnlp-main.1739/';
const feed = 'https://aclanthology.org/2025.emnlp-main.1739.pdf';
const board: Leaderboard = {
  benchmark: 'nitibench', static: 'paper', url, feed,
  terms: 'ACL Anthology copyright policy: https://aclanthology.org/faq/copyright/.',
  headline: 'The headline is the plain mean of the answer coverage scores for NitiBench-CCL and NitiBench-Tax.',
  parts: { ccl: 'NitiBench-CCL', tax: 'NitiBench-Tax' },
  stats: Object.fromEntries(['cclRetrievalRecall','cclCitationRecall','cclCitationPrecision','cclCitationF1','cclContradiction','taxRetrievalRecall','taxCitationRecall','taxCitationPrecision','taxCitationF1','taxContradiction'].map(key => [key, { name: key.replace(/^ccl/, 'Corporate and commercial law ').replace(/^tax/, 'Tax ').replace(/([a-z])([A-Z])/g, '$1 $2'), unit: 'score', better: key.endsWith('Contradiction') ? 'lower' : 'higher', note: 'Stored from 0 to 1.' }])),
  async fetch() {
    const pdf = await pdfText(feed);
    const end = pdf.indexOf('Table 3: Effect of LLM configuration on end-to-end performance');
    const table = pdf.slice(pdf.lastIndexOf('\f',end),end);
    if (end < 0 || !/Retriever Recall.*E2E Recall.*E2E Precision.*E2E F1.*Coverage.*Contradiction/.test(table)) {
      throw new Error('Missing NitiBench result columns');
    }
    const rows = new Map<string, LeaderboardRow>();
    for (const [i, key] of ['ccl','tax'].entries()) {
      const section = table.split(/NitiBench-(?:CCL|Tax) Dataset/)[i+1];
      if (!section) throw new Error('Missing NitiBench dataset');
      const pattern = /Ref Depth 1[ \t]+([\d. \t]+)\n\s*([\w.-]+)\s+([\d.]+)\s+No Ref[ \t]+([\d. \t]+)/g;
      const groups = [...section.matchAll(pattern)];
      if (groups.length !== 4) throw new Error('Missing generator results');
      for (const [, ref, model, retrieval, noRef] of groups) {
        for (const [setting,raw] of [['Ref Depth 1',ref],['No Ref',noRef]]) {
          const values = raw.trim().split(/\s+/).map(numberCell);
          if (values.length !== 5) throw new Error('Invalid generator result');
          const id = model + '/' + setting;
          const row = rows.get(id) ?? { model, setting, score: 0, metrics: {} as Record<string,number> };
          const metrics = row.metrics!;
          metrics[key] = values[3];
          metrics[key+'RetrievalRecall'] = numberCell(retrieval);
          for (const [j,name] of ['CitationRecall','CitationPrecision','CitationF1'].entries()) metrics[key+name] = values[j];
          metrics[key+'Contradiction'] = values[4];
          rows.set(id,row);
        }
      }
    }
    for (const row of rows.values()) row.score = (row.metrics!.ccl + row.metrics!.tax) / 2;
    return checked([...rows.values()],8);
  },
};
export default board;
