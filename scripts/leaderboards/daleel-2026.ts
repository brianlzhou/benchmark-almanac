// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Daleel evaluates Arabic paragraph labels and argument spans. Table 6 reports both closed-track test F1 scores.
// The system papers identify the models shared across tasks and describe task-specific heads and ensemble settings.
// https://aclanthology.org/2026.arabicnlp-sharedtasks.162/ and https://aclanthology.org/2026.arabicnlp-sharedtasks.168/
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.arabicnlp-sharedtasks.161.pdf';
const board: Leaderboard = {
  benchmark: 'daleel-2026', url: 'https://aclanthology.org/2026.arabicnlp-sharedtasks.161/', feed,
  terms: 'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  harnesses: 'system', parts: { classification: 'Paragraph Classification', detection: 'ADU Detection' },
  async fetch() {
    const pdf = await pdfText(feed);
    const table = pdf.split(/Team\s+Affiliation\s+Task 1\s+Task 2/)[1]?.split('Table 6:')[0];
    if (!table?.match(/Closed\s+Open\s+Closed\s+Open/)) throw new Error('Daleel result columns changed');
    const systems = [
      { team: 'BME-Daleel', model: 'XLM-R-large', models: ['XLM-R-large', 'MARBERTv2', 'CAMeLBERT-mix', 'mDeBERTa-v3-base', 'JHU English–Arabic'] },
      { team: 'AIDAL-ARG', model: 'CAMeL-Bert-mix' },
    ];
    const rows: LeaderboardRow[] = systems.map(({ team, model, models }) => {
      const line = table.split('\n').find(l => l.startsWith(team + ' '));
      const values = line?.match(/\d+ \(([\d.]+)\)\s+–\s+\d+ \(([\d.]+)\)\s+–\s*$/);
      if (!values) throw new Error('Daleel closed track scores missing for ' + team);
      const metrics = { classification: Number(values[1]), detection: Number(values[2]) };
      return { model, models, harness: team, submitter: team, setting: 'Closed track',
        score: (metrics.classification + metrics.detection) / 2, metrics };
    });
    return checked(rows, 2);
  },
};
export default board;
