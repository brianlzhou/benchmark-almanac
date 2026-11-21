// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CrisisMMD labels disaster messages and images. Tables 2 and 3 of the authors' baseline paper
// measure accuracy on agreed-label examples for two tasks. They exclude image-only damage severity.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mimran.me/papers/analysis_sm_data_using_multimodal_deep_learning_ISCRAM2020.pdf';
const models = { Text: 'CNN', Image: 'VGG16', 'Text + Image': 'Multimodal' };
const board: Leaderboard = {
  benchmark: 'crisismmd', static: 'paper', url: feed, feed,
  terms: 'The authors publish these baseline tables in the ISCRAM proceedings. ' + feed,
  stats: {
    informativenessPrecision: { name: 'Informativeness precision', unit: '%', better: 'higher' },
    informativenessRecall: { name: 'Informativeness recall', unit: '%', better: 'higher' },
    informativenessF1: { name: 'Informativeness F1 score', unit: '%', better: 'higher' },
    humanitarianPrecision: { name: 'Humanitarian precision', unit: '%', better: 'higher' },
    humanitarianRecall: { name: 'Humanitarian recall', unit: '%', better: 'higher' },
    humanitarianF1: { name: 'Humanitarian F1 score', unit: '%', better: 'higher' },
  },
  parts: { informativeness: 'Informativeness', humanitarian: 'Humanitarian' },
  headline: 'The headline averages accuracy on informativeness and humanitarian classification for examples with matching text and image labels.',
  async fetch() {
    const paper = await pdfText(feed);
    const tasks = ['informativeness', 'humanitarian'];
    const metricsByModel = new Map<string, Record<string, number>>();
    for (const [index, task] of tasks.entries()) {
      const section = paper.split('Table ' + (index + 2) + '. Results for the ' + task + ' classification task.')[1]?.split(/Table 3\.|DISCUSSION/)[0];
      if (!section || !/Modality\s+Accuracy\s+Precision\s+Recall\s+F1-score/.test(section)) throw Error('Missing columns for ' + task);
      for (const [modality, model] of Object.entries(models)) {
        const row = section.split('\n').map(line => line.trim().replace(/\s+/g, ' ').replace(/^Multimodal /, '')).find(line => line.startsWith(modality + ' ') && /^\d/.test(line.slice(modality.length + 1)));
        if (!row) throw Error('Missing row for ' + model);
        const values = row.slice(modality.length).trim().split(' ').map(Number);
        if (values.length !== 4 || !values.every(Number.isFinite)) throw Error('Unexpected metrics for ' + model);
        const metrics = metricsByModel.get(model) ?? {};
        [metrics[task], metrics[task + 'Precision'], metrics[task + 'Recall'], metrics[task + 'F1']] = values;
        metricsByModel.set(model, metrics);
      }
    }
    return checked(Array.from(metricsByModel, ([model, metrics]) => ({
      model, score: (metrics.informativeness + metrics.humanitarian) / 2, metrics,
    })), 3);
  },
};
export default board;
