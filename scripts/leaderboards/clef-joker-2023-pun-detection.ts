// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Tables 3, 5 and 7 report full-test F1 for English, French and Spanish pun detection.
// The starred columns cover attempted examples only. Training scores are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-3497/paper-149.pdf';
const parts = { en: 'English', fr: 'French', es: 'Spanish' };
const runs: [string, string, string, string?][] = [
  ['Croland_GPT3', 'GPT-3', 'Croland'],
  ...['easy', 'label', 'no_label'].map(s => ['LJGG_t5_large_' + s, 'T5-large', 'LJGG', s] as [string,string,string,string]),
  ['Les_miserables_fasttext', 'FastText', 'Les_miserables'], ['Les_miserables_simplet5', 'SimpleT5', 'Les_miserables'],
  ['Smroltra_FastText', 'FastText', 'Smroltra'], ['Smroltra_Logistic-Regression', 'Logistic Regression', 'Smroltra'],
  ['Smroltra_MLP', 'MLP', 'Smroltra'], ['Smroltra_NBC', 'Naïve Bayes', 'Smroltra'],
  ['Smroltra_SimpleT5', 'SimpleT5', 'Smroltra'], ['UBO_SimpleT5', 'SimpleT5', 'UBO'],
  ['AKRaNLU_seqclassification', 'XLM-Roberta', 'AKRaNLU'],
];
const board: Leaderboard = {
  benchmark: 'clef-joker-2023-pun-detection', url: feed, feed, parts,
  terms: 'The authors publish the overview under CC BY 4.0. https://ceur-ws.org/Vol-3497/paper-149.pdf',
  stats: Object.fromEntries(['en','fr','es'].flatMap(language => [['' + language + 'Precision', language.toUpperCase() + ' precision'], [language + 'Recall', language.toUpperCase() + ' recall'], [language + 'Accuracy', language.toUpperCase() + ' accuracy']]).map(([key, name]) => [key, { name, unit: '%', better: 'higher' }])),
  async fetch() {
    const pdf = await pdfText(feed);
    const results = new Map<string, Record<string, number>>();
    for (const [key, language] of Object.entries(parts)) {
      const marker = 'Results for Task 1 (pun detection) in ' + language + ' on the test data';
      const section = pdf.split(marker)[1]?.trimStart().split(/\n\s*\n/)[0];
      if (!section || !/run ID\s+#\s+P\s+R\s+F1\s+A/.test(section)) throw new Error('Missing results for ' + language);
      for (const line of section.split('\n').slice(1)) {
        const [id, count, p, r, f1, a] = line.trim().split(/\s+/);
        if (!id || !count || !a) continue;
        const run = id.replace(/_(EN|FR|ES)_/, '_').replace(/_(en|fr|es)$/, '');
        const metrics = results.get(run) ?? {};
        metrics[key] = Number(f1);
        metrics[key + 'Precision'] = Number(p);
        metrics[key + 'Recall'] = Number(r);
        metrics[key + 'Accuracy'] = Number(a);
        results.set(run, metrics);
      }
    }
    const rows: LeaderboardRow[] = runs.map(([id, model, team, variant]) => {
      const metrics = results.get(id);
      if (!metrics || !Object.values(metrics).every(Number.isFinite) || Object.keys(metrics).length !== 12) {
        throw new Error('Incomplete JOKER submission ' + id);
      }
      return { model, setting: [team, variant].filter(Boolean).join(', '), submitter: team,
        score: (metrics.en + metrics.fr + metrics.es) / 3, metrics };
    });
    return checked(rows, 13);
  },
};
export default board;
