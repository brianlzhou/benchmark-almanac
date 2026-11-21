// ChemProt tests relation extraction between chemical and protein mentions.
// The score is micro F1 on the ChemProt test set, reported as a percentage.
// This importer reads the ChemProt row in Table 6 of the PubMedBERT paper.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {paperHtml, PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables, grid, checked} from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2007.15779';
const board: Leaderboard = {benchmark: 'chemprot', url: 'https://biocreative.bioinformatics.udel.edu/tasks/biocreative-vi/track-5/', feed: FEED, static: 'paper', terms: PAPER_TERMS, async fetch() {
  const tables = paperTables(await paperHtml(FEED));
  const rows = tables.map(grid).find(rs => rs.some(r => r[0]?.startsWith('ChemProt') && r.length >= 10));
  if (!rows) throw new Error('PubMedBERT Table 6 missing');
  const row = rows.find(r => r[0]?.startsWith('ChemProt'));
  if (!row || row.length < 10) throw new Error('PubMedBERT ChemProt row changed');
  const models = [
    ['BERT', 'uncased'], ['BERT', 'cased'], ['RoBERTa', 'cased'], ['BioBERT', 'cased'],
    ['SciBERT', 'uncased'], ['SciBERT', 'cased'], ['ClinicalBERT', 'cased'], ['BlueBERT', 'cased'], ['PubMedBERT', 'uncased'],
  ] as const;
  const result: LeaderboardRow[] = models.map(([model, setting], i) => ({model, setting, score: Number(row[i + 1])}));
  return checked(result, 9);
}};
export default board;
