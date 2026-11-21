// The ECHR Legal Corpus tests clause and relation argument mining in court decisions.
// The paper reports no whole-corpus score, so the headline is argument clause recognition, its first task.
// This importer reads Table 2 in the authors' ACL Anthology PDF and keeps the other task F1 scores.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2020.argmining-1.8.pdf';
const board: Leaderboard = {
  benchmark: 'echr-argument-mining-poudyal',
  feed,
  url: 'https://aclanthology.org/2020.argmining-1.8/',
  static: 'paper',
  headline: 'The paper reports no overall score, so this is the argument clause recognition F1 column, its first task.',
  parts: {
    argumentClauseRecognition: 'Argument clause recognition',
    argumentRelationsMining: 'Argument relations mining',
    premiseRecognition: 'Premise recognition',
    conclusionRecognition: 'Conclusion recognition',
  },
  terms: 'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Argument clause recognition\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)[\s\S]*?Argument relations mining\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)[\s\S]*?Premise recognition\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)[\s\S]*?Conclusion recognition\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/);
    if (!table) throw new Error('Missing ECHR Table 2');
    const values = table.slice(1).map(Number);
    if (values.length !== 12 || values.some(value => !Number.isFinite(value))) throw new Error('Invalid ECHR Table 2');
    return checked([{ model: 'RoBERTa', score: values[2], metrics: {
      argumentClauseRecognition: values[2], argumentRelationsMining: values[5], premiseRecognition: values[8], conclusionRecognition: values[11],
    } }], 1);
  },
};
export default board;
