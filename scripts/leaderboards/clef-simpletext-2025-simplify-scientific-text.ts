// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CLEF tests sentence-level and document-level scientific text simplification. Tables 5 and 6 rank by SARI
// on the same 217 abstracts. The run labels and the paper's team descriptions identify the paired runs.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-4038/paper_344.pdf';
const pairs = [
  ['DSGT', 'LLaMA 3.3 70b', 'Few-shot', 'plan_guided_lla', 'llama_summary_s'],
  ['UBOnlp', 'gpt4o', 'UBOnlp', 'gpt4o', 'gpt4o'],
  ['UM-FHS', 'gpt-4.1-mini', 'Zero-shot', 'gpt-4.1-mini', 'gpt-4.1-mini'],
  ['UM-FHS', 'gpt-4.1-mini', 'UM-FHS variant', 'gpt-4.1-mini-', 'gpt-4.1-mini-'],
  ['UM-FHS', 'gpt-4.1', 'Zero-shot', 'gpt-4.1', 'gpt-4.1'],
  ['UM-FHS', 'gpt-4.1-nano', 'Zero-shot', 'gpt-4.1-nano', 'gpt-4.1-nano'],
  ['SINAI', 'GPT-4.1', 'Zero-shot V1', 'PRMZSTASK11V1', 'PRMZSTASK12V1'],
  ['SINAI', 'GPT-4.1', 'Zero-shot V2', 'PRMZSTASK11V2', 'PRMZSTASK12V2'],
  ['AIIRLab', 'llama3.1-8b', 'AIIRLab', 'llama3.1-8b', 'llama_3.1-8b'],
  ['PICT', 'T5', 'S3Pipeline', 'S3Pipeline', 'S3Pipeline'],
  ['RECAIDS', 'T5', 'RECAIDS', 'T5', 'T5'],
  ['Scalar', 'GPT-2', 'gpt_md_2_1', 'gpt_md_2_1', 'gpt_md_2_1'],
  ['UvA', 'BART', 'bartdoc-ca', 'bartdoc-ca', 'bartdoc-ca'],
];
const other = ['BLEU', 'FKGL', 'CompressionRatio', 'SentenceSplits', 'LevenshteinSimilarity',
  'ExactCopies', 'AdditionsProportion', 'DeletionsProportion', 'LexicalComplexityScore'];

function scores(section: string, label: string) {
  const matches = section.split('\n').map(line => line.trim().match(/^(.+?)\s+217\s+([\d.\s]+)$/))
    .filter(match => match && match[1] === label);
  if (matches.length !== 1) throw new Error('Missing or ambiguous SimpleText run: ' + label);
  const values = matches[0]![2].trim().split(/\s+/).map(Number);
  if (values.length !== other.length + 1 || !values.every(Number.isFinite)) throw new Error('Changed SimpleText columns');
  return values;
}
const board: Leaderboard = {
  benchmark: 'clef-simpletext-2025-simplify-scientific-text', url: feed, feed,
  terms: 'The paper uses CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  stats: {
    sentenceBLEU: { name: 'Sentence BLEU', unit: '%', better: 'higher' },
    documentBLEU: { name: 'Document BLEU', unit: '%', better: 'higher' },
    sentenceFKGL: { name: 'Sentence Flesch-Kincaid grade level', unit: 'score', better: 'lower' },
    documentFKGL: { name: 'Document Flesch-Kincaid grade level', unit: 'score', better: 'lower' },
    sentenceCompressionRatio: { name: 'Sentence compression ratio', unit: 'index' },
    documentCompressionRatio: { name: 'Document compression ratio', unit: 'index' },
    sentenceSentenceSplits: { name: 'Sentence sentence splits', unit: 'index' },
    documentSentenceSplits: { name: 'Document sentence splits', unit: 'index' },
    sentenceLevenshteinSimilarity: { name: 'Sentence Levenshtein similarity', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    documentLevenshteinSimilarity: { name: 'Document Levenshtein similarity', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    sentenceExactCopies: { name: 'Sentence exact copies', unit: 'score', note: 'Reported from 0 to 1.' },
    documentExactCopies: { name: 'Document exact copies', unit: 'score', note: 'Reported from 0 to 1.' },
    sentenceAdditionsProportion: { name: 'Sentence additions proportion', unit: 'score', note: 'Reported from 0 to 1.' },
    documentAdditionsProportion: { name: 'Document additions proportion', unit: 'score', note: 'Reported from 0 to 1.' },
    sentenceDeletionsProportion: { name: 'Sentence deletions proportion', unit: 'score', note: 'Reported from 0 to 1.' },
    documentDeletionsProportion: { name: 'Document deletions proportion', unit: 'score', note: 'Reported from 0 to 1.' },
    sentenceLexicalComplexityScore: { name: 'Sentence lexical complexity score', unit: 'score', better: 'lower' },
    documentLexicalComplexityScore: { name: 'Document lexical complexity score', unit: 'score', better: 'lower' },
  },
  parts: { sentence: 'Sentence-level simplification', document: 'Document-level simplification' },
  async fetch() {
    const paper = await pdfText(feed);
    const sections = [5, 6].map((n, i) => {
      const section = paper.split('\nTable ' + n + '\nResults for CLEF 2025 SimpleText Task 1.' + (i + 1))[1]
        ?? paper.split('\fTable ' + n + '\nResults for CLEF 2025 SimpleText Task 1.' + (i + 1))[1];
      if (!section?.includes('217 Plain Language')) throw new Error('Missing 217-document results');
      const table = section.split('Team/Method')[1]?.split(/\n\s*\n/)[0];
      if (!table || !/count\s+SARI\s+BLEU\s+FKGL/.test(section.split('Team/Method')[0])) throw new Error('Missing SARI table');
      return table;
    });
    return checked(pairs.map(([submitter, model, setting, sentenceLabel, documentLabel]) => {
      const sentence = scores(sections[0], submitter + ' ' + sentenceLabel);
      const document = scores(sections[1], submitter + ' ' + documentLabel);
      const metrics: Record<string, number> = { sentence: sentence[0], document: document[0] };
      other.forEach((key, i) => { metrics['sentence' + key] = sentence[i+1]; metrics['document' + key] = document[i+1]; });
      return { model, submitter, setting, score: (sentence[0] + document[0]) / 2, metrics };
    }), 13);
  },
};
export default board;
