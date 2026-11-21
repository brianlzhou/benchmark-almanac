// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// Table 1 gives F1 for tumor, node and metastasis staging on two pathology report sets.
// Team papers 18 and 32 identify a model switch and conflicting tiebreak scores, so those teams are omitted.
// Paper 22 names Qwen3.5-27B as URJC's model and confirms the regex and fine-tuning setting on both sets.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.smm4h-1.50.pdf';
const parts = { test1T: 'Test set 1: Tumor', test1N: 'Test set 1: Node', test1M: 'Test set 1: Metastasis',
  test2T: 'Tiebreak: Tumor', test2N: 'Tiebreak: Node', test2M: 'Tiebreak: Metastasis' };
const models: Record<string,string> = { URJC: 'Qwen3.5-27B', LLATMU: 'BioClinical-ModernBERT-large',
  MedMind: 'GPT-5.4-mini', CUETDiagNLP: 'GatorTron-base', Blue: 'Clinical-BigBird', 'BBTEN (Baseline)': 'BB-TEN' };
const board: Leaderboard = {
  benchmark: 'smm4h-heard-2026-tnm', url: 'https://aclanthology.org/2026.smm4h-1.50/', feed, static: 'paper', parts,
  headline: 'The headline averages the three component F1 scores on each of the two test sets.',
  terms: 'ACL Anthology terms. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const pdf = await pdfText(feed);
    const table = pdf.split('Table 1: F1 scores by team across tasks.')[0].split('\f').at(-1)!;
    if (!/F1T\s+F1N\s+F1M\s+F1T\s+F1N\s+F1M/.test(table)) throw new Error('Missing TNM columns');
    const matches = [...table.matchAll(/^\s*(\S[^\n]*?)\s+((?:[01]\.\d{3}\s+){5}[01]\.\d{3})\s*$/gm)];
    if (matches.length !== 8) throw new Error('Unexpected team count');
    return checked(matches.filter(([, team]) => team in models).map(([, team, numbers]) => {
      const scores = numbers.split(/\s+/).map(Number);
      return { model: models[team], submitter: team === 'BBTEN (Baseline)' ? undefined : team,
        setting: team === 'URJC' ? 'Regex + LLM SFT' : undefined,
        score: scores.reduce((a,b) => a+b, 0)/scores.length, metrics: Object.fromEntries(Object.keys(parts).map((k,i) => [k, scores[i]])) };
    }), 6);
  },
};
export default board;
