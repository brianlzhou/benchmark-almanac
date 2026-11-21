// SimpleText Task 2 evaluates detection and avoidance of unsupported text in scientific simplifications.
// The organizers call posthoc detection the main task. Table 4 ranks runs by F1. Table 5 adds sourced detection.
// Table 6 gives distortion category F1 and AUC. Task 2.3 uses different measures and different submissions.
// Team papers 347 and 356 in the same volume identify the classifiers behind the submitted run names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-4038/paper_345.pdf';
const identities: Record<string,string> = {
  'DSGT bertclassifier': 'BERT Classifier', 'DSGT llm': 'llama-3.3-70b-versatile',
  'DSGT nli_entailment': 'facebook/bart-large-mnli', 'UBOnlp gpt4o': 'gpt4o',
  'DUTH et': 'Extra Trees', 'DUTH rf': 'Random Forest', 'DUTH svc': 'Support Vector Classifier',
  'DUTH xgb': 'XGBoost', 'DUTH logreg': 'Logistic Regression',
};
const categories = { noError: 'No Error', fluency: 'Fluency', alignment: 'Alignment', information: 'Information', simplification: 'Simplification' };
const board: Leaderboard = {
  static: 'paper',
  headline: 'The headline is F1 for posthoc detection, which the organizers identify as the main task.',
  benchmark: 'clef-simpletext-2025-identify-avoid-hallucination',
  url: feed, feed, terms: 'CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: { posthoc: 'Posthoc detection', sourced: 'Detection with sources', ...categories },
  async fetch() {
    const paper = await pdfText(feed);
    const rows = new Map<string, LeaderboardRow>();
    for (const [num, part] of [[4, 'posthoc'], [5, 'sourced']] as const) {
      const table = paper.split('\fTable ' + num + '\n')[1]?.split(/\n\s*\n/)[0];
      if (!table || !/count\s+Acc\.\s+Prec\s+Rec\s+F1\s+AUROC\s+AUPRC/.test(table)) throw new Error('Missing detection results');
      for (const line of table.split('\n')) {
        const [team, run, count, ...cells] = line.trim().split(/\s+/);
        const key = team + ' ' + run?.replace(/^Task21(?:posthoc|sourced)_/, '');
        if (!(key in identities)) continue;
        const values = cells.map(Number);
        if (values.length !== 6 || !values.every(Number.isFinite)) throw new Error('Invalid detection result');
        const [accuracy, precision, recall, f1, auroc, auprc] = values;
        const row = rows.get(key) ?? { model: identities[key], submitter: team, score: f1, metrics: {} };
        if (part === 'sourced' && !rows.has(key)) continue;
        Object.assign(row.metrics!, { [part]: f1, [part+'Count']: Number(count.replaceAll(',', '')),
          [part+'Accuracy']: accuracy, [part+'Precision']: precision, [part+'Recall']: recall,
          [part+'AUROC']: auroc, [part+'AUPRC']: auprc });
        rows.set(key, row);
      }
    }
    const table = paper.split('\fTable 6\n')[1]?.split(/\n\s*\n/)[0];
    if (!table?.includes('F1 and AUC-PR')) throw new Error('Missing distortion results');
    for (const line of table.split('\n')) {
      const [team, run, ...cells] = line.trim().split(/\s+/);
      if (team !== 'UBOnlp' || run !== 'gpt4o') continue;
      if (cells.length !== 10 || cells.some(cell => !Number.isFinite(Number(cell)))) throw new Error('Invalid distortion scores');
      const metrics = rows.get('UBOnlp gpt4o')!.metrics!;
      Object.keys(categories).forEach((key, i) => { metrics[key] = Number(cells[2*i]); metrics[key+'AUPRC'] = Number(cells[2*i+1]); });
    }
    return checked([...rows.values()], 9);
  },
};
export default board;
