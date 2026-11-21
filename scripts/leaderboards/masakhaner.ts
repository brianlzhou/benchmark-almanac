// MasakhaNER tests named entity recognition in ten African languages.
// Table 5 reports average F1 across all ten languages, with five runs for each training configuration.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://aclanthology.org/2021.tacl-1.66.pdf';
const languages = { amh: 'Amharic', hau: 'Hausa', ibo: 'Igbo', kin: 'Kinyarwanda', lug: 'Luganda',
  luo: 'Luo', pcm: 'Nigerian Pidgin', swa: 'Swahili', wol: 'Wolof', yor: 'Yoruba' };
const columns = [
  ['CNN-BiLSTM-CRF', 'Supervised'], ['mBERT-base', 'MeanE'], ['mBERT-base', 'FTune'],
  ['XLM-R-base', 'MeanE'], ['XLM-R-base', 'FTune'], ['XLM-R Large', 'FTune'],
  ['lang. BERT', 'Language-adaptive fine-tuning'], ['lang. XLM-R', 'Language-adaptive fine-tuning'],
];
const board: Leaderboard = {
  benchmark: 'masakhaner', feed, url: 'https://aclanthology.org/2021.tacl-1.66/', static: 'paper',
  terms: 'The ACL Anthology publishes the paper under the terms listed at https://aclanthology.org/2021.tacl-1.66/.',
  parts: languages,
  async fetch() {
    const table = (await pdfText(feed)).split('Table 5: NER model comparison')[0].split('Lang.               In').at(-1);
    if (!table?.includes('MeanE / FTune') || !table.includes('avg (excl. amh)')) throw Error('Missing Table 5');
    const byLanguage = new Map<string, number[]>();
    for (const line of table.split('\n')) {
      const row = line.trim().split(/\s+/);
      if (!(row[0] in languages) && !(row[0] === 'avg' && row[1] === '–')) continue;
      const values = row.slice(4).filter(v => v !== '/').map(Number);
      if (values.length !== columns.length || !values.every(Number.isFinite)) throw Error('Invalid F1 row: ' + line);
      byLanguage.set(row[0], values);
    }
    if (byLanguage.size !== 11) throw Error('Missing language results');
    return checked(columns.map(([model, setting], i) => ({
      model, setting, trials: 5, score: byLanguage.get('avg')![i],
      metrics: Object.fromEntries(Object.keys(languages).map(lang => [lang, byLanguage.get(lang)![i]])),
    })), 8);
  },
};
export default board;
