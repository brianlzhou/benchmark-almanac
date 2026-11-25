// NollySenti evaluates sentiment classifiers on Nigerian movie reviews.
// The paper's Table 3 reports the whole-benchmark average accuracy across its language and training settings.
// This importer keeps the language accuracies and the reported standard error.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2305.10971';
const board: Leaderboard = {
  benchmark: 'nollysenti',
  static: 'paper',
  url: 'https://arxiv.org/abs/2305.10971',
  feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2305.10971',
  parts: {
    en410: { name: 'English (N=410)', group: 'Language' },
    en1300: { name: 'English (N=1300)', group: 'Language' },
    hau: { name: 'Hausa (N=410)', group: 'Language' },
    ibo: { name: 'Igbo (N=410)', group: 'Language' },
    pcm: { name: 'Nigerian Pidgin (N=410)', group: 'Language' },
    yor410: { name: 'Yoruba (N=410)', group: 'Language' },
    yor900: { name: 'Yoruba (N=900)', group: 'Language' },
  },
  stats: { excludingEnglish: { name: 'Average excluding English', unit: '%', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    const cap = text.indexOf('Table 3: Baseline result using classical machine learning');
    if (cap < 0) throw new Error('NollySenti Table 3 missing');
    const block = text.slice(Math.max(0, cap - 1200), cap);
    const ROW = /^\s*(LogisticReg|SVM|mBERT|XLM-R-base|mDeBERTaV3|AfriBERTa-large|AfroXLMR-base)\s+(<\d+K|\d+M)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)±([\d.]+)\s+([\d.]+)±([\d.]+)/;
    const rows: LeaderboardRow[] = [];
    for (const line of block.split(/\r?\n/)) {
      const m = line.match(ROW);
      if (!m) continue;
      const [, model, pRaw, en410, en1300, hau, ibo, pcm, yor410, yor900, avg, avgStd, exclEng, exclStd] = m;
      const pMatch = pRaw.match(/^(\d+)M$/);
      const params = pMatch ? Number(pMatch[1]) / 1000 : undefined;
      rows.push({
        model,
        score: Number(avg),
        trials: 5,
        ...(params !== undefined ? { params } : {}),
        metrics: {
          en410: Number(en410),
          en1300: Number(en1300),
          hau: Number(hau),
          ibo: Number(ibo),
          pcm: Number(pcm),
          yor410: Number(yor410),
          yor900: Number(yor900),
          std: Number(avgStd),
          excludingEnglish: Number(exclEng),
          excludingEnglishStd: Number(exclStd),
        },
      });
    }
    return checked(rows, 7);
  },
};
export default board;
