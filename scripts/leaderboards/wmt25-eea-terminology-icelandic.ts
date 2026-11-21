// WMT25 measures official Icelandic terminology in English translations into Icelandic. The authors publish automatic accuracy across 413 term occurrences in a TSV.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://media.githubusercontent.com/media/steinst/WMT25_EEA_test_suite/main/evaluation/automatic/EEA_automatic_evaluation_results.tsv";
const board: Leaderboard = {
  benchmark: "wmt25-eea-terminology-icelandic",
  url: "https://github.com/steinst/WMT25_EEA_test_suite/blob/main/evaluation/automatic/EEA_automatic_evaluation_results.tsv",
  feed,
  terms: "Automatic term accuracy uses 413 occurrences across 256 sentences. The repository lists no reuse license. GitHub lists crawler restrictions and the media host returns 404 for robots.txt.",
  stats: { termsCorrect: { name: 'Terms correct', unit: 'count' }, termsTotal: { name: 'Terms tested', unit: 'count' }, sentencesCorrect: { name: 'Sentences correct', unit: 'count' }, sentencesTotal: { name: 'Sentences tested', unit: 'count' } },
  parts: {"sentence":"Sentence accuracy"},
  async fetch() {
    const source = await fetchText(feed);
    const headers = ["system","terms_correct","terms_total","term_accuracy","sentences_correct","sentences_total","sentence_accuracy"];
    const table = [source.trim().split(/\r?\n/).map(l => l.split('\t').map(c => c.trim()))].find(t => headers.every(h => t[0]?.includes(h)));
    if (!table) throw new Error('Missing results table');
    const records = table.slice(1).map(c => Object.fromEntries(table[0].map((h, i) => [h, c[i]])));
    const numeric = (s: string) => {
      const value = s?.replace(/%$/, '').trim();
      if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid result: ' + s);
      return Number(value);
    };
    const rows = records.map(r => {
      const model = r["system"];
      if (!model) throw new Error('Missing model name');
      return { model, score: numeric(r["term_accuracy"]),
        metrics: { sentence: numeric(r["sentence_accuracy"]), termsCorrect: numeric(r["terms_correct"]), termsTotal: numeric(r["terms_total"]), sentencesCorrect: numeric(r["sentences_correct"]), sentencesTotal: numeric(r["sentences_total"]) } };
    });
    if (rows.length < 34) throw new Error('Incomplete results');
    return rows;
  },
};
export default board;
