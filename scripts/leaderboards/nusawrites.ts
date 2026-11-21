// NusaWrites tests classification and translation in Indonesian local languages.
// Table 2 reports macro-F1 for five classification tasks and SacreBLEU and ChrF++ for translation.
// The headline is the table's first metric, NusaParagraph emotion macro-F1, averaged over languages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2023.ijcnlp-main.60.pdf';
const board: Leaderboard = {
  benchmark: 'nusawrites', feed, url: 'https://aclanthology.org/2023.ijcnlp-main.60/', static: 'paper',
  headline: 'The paper reports no overall score, so the headline is macro-F1 for NusaParagraph emotion classification.',
  terms: 'ACL Anthology publishes the paper under https://aclanthology.org/info/copyright/.',
  parts: {
    paragraphEmotion: 'NusaParagraph emotion', rhetoricalMode: 'NusaParagraph rhetorical mode', topic: 'NusaParagraph topic',
    translationEmotion: 'NusaTranslation emotion', sentiment: 'NusaTranslation sentiment',
    sacrebleu: { name: 'Translation SacreBLEU', unit: 'score' }, chrf: { name: 'Translation ChrF++', unit: 'score' },
  },
  async fetch() {
    const page = (await pdfText(feed)).split('\f').find(p => p.includes('Table 2: Overall performance on all tasks'));
    if (!page?.includes('SacreBLEU   ChrF++') || !/Emot\s+Rhetorical Mode\s+Topic\s+Emot\s+Senti/.test(page)) {
      throw new Error('NusaWrites Table 2 columns missing');
    }
    const rows: LeaderboardRow[] = [];
    let setting = 'Classical';
    for (const line of page.split('(a) NLU evaluation results')[0].split('\n')) {
      if (/^\s*Fine-tuning\b/.test(line)) setting = 'Fine-tuning';
      if (/^\s*Zero-shot\b/.test(line)) setting = 'Zero-shot';
      const m = line.match(/^\s*(\S.*?)\s{2,}(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)(.*)$/);
      if (!m) continue;
      const [, model, emotion, rhetoric, topic, translationEmotion, sentiment, right] = m;
      const metrics: Record<string, number> = {
        paragraphEmotion: +emotion, rhetoricalMode: +rhetoric, topic: +topic, translationEmotion: +translationEmotion, sentiment: +sentiment,
      };
      if (setting === 'Zero-shot') {
        const translation = right.trim().split(/\s+/);
        if (translation[0] !== model || translation.length !== 3 || !translation.slice(1).every(s => /^\d+\.\d+$/.test(s))) {
          throw new Error('Mismatched classification and translation rows');
        }
        metrics.sacrebleu = Number(translation[1]);
        metrics.chrf = Number(translation[2]);
      }
      rows.push({ model, setting, score: +emotion, metrics });
    }
    return checked(rows, 19);
  },
};
export default board;
