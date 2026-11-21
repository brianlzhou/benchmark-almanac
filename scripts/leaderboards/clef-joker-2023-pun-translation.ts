// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// JOKER tests pun translation. Tables 3 and 5 rank runs by #S, the number preserving both meaning and wordplay.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-3497/paper-151.pdf';
// Pair only run IDs with the same model, method and submitting team in the two test tables.
const pairs = [
  ['GPT-3', 'Croland_task_3_EN_FR_GPT3', 'Croland_task_3_ENESGPT3', ''],
  ['Google Translate', 'LJGG_Google_Translator_EN_FR_auto', 'LJGG_task_3_GoogleTranslatorENESauto', ''],
  ...['mt5_base', 't5_large'].flatMap(model => ['', '_no_label'].map(suffix => [
    model === 'mt5_base' ? 'mT5-base' : 'T5-large', 'LJGG_task3_fr_' + model + suffix + '_auto',
    'LJGG_task3_es_' + model + suffix + '_auto', suffix ? 'No label' : 'With label'])),
  ['BLOOM', 'Smroltra_task_3_EN-FR_BLOOM', 'Smroltra_task_3_ENESBLOOM', ''],
  ['Opus-MT', 'Smroltra_task_3_EN-FR_EasyNMT-Opus', 'Smroltra_task_3_EN-ES_EasyNMT-Opus', 'EasyNMT'],
  ['Google Translate', 'Smroltra_task_3_EN-FR_GoogleTranslation', 'Smroltra_task_3_EN-ES_GoogleTranslation', ''],
  ['SimpleT5', 'Smroltra_task_3_EN-FR_SimpleT5', 'Smroltra_task_3_EN-ES_SimpleT5', ''],
  ['j2-grande', 'TheLangVerse_task_3_j2-grande-finetuned', 'TheLangVerse_task_3_j2-grande-finetuned', 'Fine-tuned'],
  ['M2M_100', 'ThePunDetectives_task_3_EN-FR_M2M100', 'ThePunDetectives_task_3_EN-ES_M2M100', ''],
  ['Opus-MT', 'ThePunDetectives_task_3_EN-FR_OpusMT', 'ThePunDetectives_task_3_ENESOpusMT', ''],
];
const fields = ['evaluated', 'submitted', 'meaning', 'meaningPercent', 'wordplay', 'wordplayPercent', 'successful', 'successPercent', 'testSuccessPercent'];
function results(paper: string, tableNumber: number, language: string) {
  const block = paper.split('\fTable ' + tableNumber + '\n')[1]?.split('\n\n')[0];
  if (!block?.includes(language + ' (test data)') || !/#E\s+#T\s+#M\s+%M\s+#W\s+%W\s+#S\s+%S\s+%R/.test(block)) throw new Error('Missing pun translation table');
  const lines = block.trim().split('\n').slice(2);
  const runs = new Map<string, number[]>();
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].trim().replace(/(GoogleTranslatorENESauto)(?=\d)/, '$1 ').split(/\s+/);
    let id = cells.shift()!;
    if (id.endsWith('-')) id += lines[++i].trim();
    const values = cells.map(x => Number(x.replaceAll(',', '')));
    if (values.length !== 9 || values.some(v => !Number.isFinite(v)) || runs.has(id)) throw new Error('Invalid translation run: ' + id);
    runs.set(id, values);
  }
  return runs;
}
const board: Leaderboard = {
  static: 'paper',
  headline: 'The headline averages the French and Spanish counts of translations that preserve meaning and wordplay.',
  benchmark: 'clef-joker-2023-pun-translation', url: feed + '#page=6', feed,
  terms: 'CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: { french: 'English to French', spanish: 'English to Spanish' },
  stats: { fr_evaluated: { name: 'FR evaluated texts', unit: 'count' }, es_evaluated: { name: 'ES evaluated texts', unit: 'count' }, fr_submitted: { name: 'FR submitted translations', unit: 'count' }, es_submitted: { name: 'ES submitted translations', unit: 'count' }, fr_meaning: { name: 'FR meaning preserved', unit: 'count' }, es_meaning: { name: 'ES meaning preserved', unit: 'count' }, fr_meaningPercent: { name: 'FR meaning preserved percentage', unit: '%', better: 'higher' }, es_meaningPercent: { name: 'ES meaning preserved percentage', unit: '%', better: 'higher' }, fr_wordplay: { name: 'FR wordplay preserved', unit: 'count' }, es_wordplay: { name: 'ES wordplay preserved', unit: 'count' }, fr_wordplayPercent: { name: 'FR wordplay preserved percentage', unit: '%', better: 'higher' }, es_wordplayPercent: { name: 'ES wordplay preserved percentage', unit: '%', better: 'higher' }, fr_successful: { name: 'FR successful translations', unit: 'count' }, es_successful: { name: 'ES successful translations', unit: 'count' }, fr_successPercent: { name: 'FR success percentage', unit: '%', better: 'higher' }, es_successPercent: { name: 'ES success percentage', unit: '%', better: 'higher' }, fr_testSuccessPercent: { name: 'FR test success percentage', unit: '%', better: 'higher' }, es_testSuccessPercent: { name: 'ES test success percentage', unit: '%', better: 'higher' } },
  async fetch() {
    const paper = await pdfText(feed);
    const fr = results(paper, 3, 'French'), es = results(paper, 5, 'Spanish');
    return checked(pairs.map(([model, frId, esId, variant]) => {
      const french = fr.get(frId), spanish = es.get(esId);
      if (!french || !spanish) throw new Error('Missing paired translation run: ' + frId);
      const submitter = frId.split('_')[0];
      const metrics: Record<string, number> = { french: french[6], spanish: spanish[6] };
      fields.forEach((field, i) => { metrics['fr_' + field] = french[i]; metrics['es_' + field] = spanish[i]; });
      return { model, submitter, setting: [submitter, variant].filter(Boolean).join(': '), score: (french[6] + spanish[6]) / 2, metrics };
    }), 13);
  },
};
export default board;
