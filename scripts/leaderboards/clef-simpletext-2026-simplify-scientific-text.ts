// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// SimpleText evaluates sentence and document simplification of scientific abstracts.
// Tables 2 and 3 rank runs by SARI on the same 32 aligned abstracts. Section 4 identifies the models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-4283/paper444.pdf';
const configurations = [
  ['FOSU-CR', 'DeepSeek-V3', 'cr', 'cr'],
  ['Elsevier', 'GPT-4.1', 'FS3_BestMat', 'FS3_BestMat'],
  ['Chennai', 'LLaMA-3.1-8b-instruct', 'Task1_1_llam', 'Task1_2_llam'],
  ['Chennai', 'LLaMA-3.1-8b-instruct', 'Task1_1_Llam', 'Task1_2_Llam'],
  ['TUKE', 'Gemma2_9B_IT', 'Gemma2_9B_IT_Pr', 'Gemma2_9B_IT_Do'],
  ['NUQLab', 'BART', 'janbakker_o_b', 'janbakker_o_b'],
];
const board: Leaderboard = {
  benchmark: 'clef-simpletext-2026-simplify-scientific-text', url: feed, feed, harnesses: 'system',
  terms: 'The authors publish this workshop paper under the license on its first page. ' + feed,
  stats: {
    sentenceBLEU: { name: 'Sentence BLEU', unit: '%', better: 'higher' },
    sentenceFKGL: { name: 'Sentence Flesch-Kincaid grade level', unit: 'score', better: 'lower' },
    documentBLEU: { name: 'Document BLEU', unit: '%', better: 'higher' },
    documentFKGL: { name: 'Document Flesch-Kincaid grade level', unit: 'score', better: 'lower' },
  },
  parts: { sentence: 'Sentence-level text simplification', document: 'Document-level text simplification' },
  async fetch() {
    const paper = await pdfText(feed);
    const tracks = [2, 3].map(n => {
      const block = paper.split('\fTable ' + n + '\n')[1]?.split('\f')[0];
      if (!block || !/count\s+SARI\s+BLEU\s+FKGL/.test(block)) throw new Error('Missing SimpleText table ' + n);
      return block.split('\n');
    });
    const rows: LeaderboardRow[] = configurations.map(([team, model, sentenceRun, documentRun]) => {
      const metrics: Record<string, number> = {};
      for (const [i, part] of ['sentence', 'document'].entries()) {
        const label = team + ' ' + [sentenceRun, documentRun][i];
        const matches = tracks[i].filter(line => line.slice(0, label.length) === label && /^\s+\d+\s/.test(line.slice(label.length)));
        if (matches.length !== 1) throw new Error('Missing or ambiguous run ' + label);
        const values = matches[0].slice(label.length).trim().split(/\s+/).map(Number);
        if (values.length !== 11 || !values.every(Number.isFinite)) throw new Error('Invalid scores for ' + label);
        metrics[part] = values[1];
        metrics[part + 'BLEU'] = values[2];
        metrics[part + 'FKGL'] = values[3];
      }
      return { model, submitter: team, harness: team, setting: sentenceRun + ' / ' + documentRun,
        ...(team === 'NUQLab' ? { models: ['BART', 'RoBERTa'] } : {}),
        metrics, score: (metrics.sentence + metrics.document) / 2 };
    });
    return checked(rows, 6);
  },
};
export default board;
