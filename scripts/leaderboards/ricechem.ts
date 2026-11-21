// RiceChem evaluates model judgments against human graders for individual chemistry rubric items.
// Tables 1, 2 and 4 give fine-tuned and zero-shot F1. Table 4 expresses F1 as a percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2404.14316';
const board: Leaderboard = {
  benchmark: 'ricechem', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  stats: { accuracy: { name: 'Accuracy', unit: '%', better: 'higher' }, precision: { name: 'Precision', unit: 'score', better: 'higher', note: 'From 0 to 1.' }, recall: { name: 'Recall', unit: 'score', better: 'higher', note: 'From 0 to 1.' } },
  aliases: { 'Gemma 7B 1.1 IT': 'gemma-1-1-7b-it', 'GPT3.5': 'gpt-3-5-turbo-jan-2024' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    function table(header: string, count: number) {
      const result = tables.find(t => t[0]?.join('|') === header);
      if (result?.length !== count + 1) throw Error('Changed RiceChem table: ' + header);
      return result.slice(1);
    }
    function value(cell: string) {
      if (!/^\d+(?:\.\d+)?$/.test(cell)) throw Error('Unexpected RiceChem score: ' + cell);
      return Number(cell);
    }
    const rows: LeaderboardRow[] = [];
    for (const [name, ...cells] of table('Model|Accuracy|Precision|Recall|F1', 6)) {
      const model = name.match(/^(.+) \((\d+)M\)$/);
      if (!model) throw Error('Missing model size');
      const stats = cells.map(s => {
        const match = s.match(/^([.\d]+) \(([.\d]+)\)$/);
        if (!match) throw Error('Missing RiceChem standard deviation');
        return [value(match[1]), value(match[2])];
      });
      const [acc, precision, recall, f1] = stats;
      rows.push({ model: model[1], params: Number(model[2]) / 1000, score: f1[0], setting: 'Fine-tuned', trials: 5,
        metrics: { std: f1[1], accuracy: acc[0], accuracyStd: acc[1], precision: precision[0],
          precisionStd: precision[1], recall: recall[0], recallStd: recall[1] } });
    }
    for (const [model, accuracy, f1] of table('Model|Accuracy|F1', 4)) {
      if (rows.some(r => r.model === model)) continue;
      rows.push({ model, score: value(f1), setting: 'Fine-tuned', metrics: { accuracy: value(accuracy) } });
    }
    for (const [name, accuracy, precision, recall, f1] of table('LLM|Accuracy|Precision|Recall|F1', 11)) {
      rows.push({ model: name.replace(/\s*\[\s*\d+\s*\]$/, ''), setting: 'Zero-shot', score: value(f1) / 100,
        metrics: { accuracy: value(accuracy), precision: value(precision) / 100, recall: value(recall) / 100 } });
    }
    return checked(rows, 19);
  },
};
export default board;
