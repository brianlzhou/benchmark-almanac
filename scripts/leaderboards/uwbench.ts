// UWBench evaluates underwater image captioning, object referring, and visual question answering.
// The paper reports different metrics for the three tasks. BLEU-1 is the first metric in Table III.
// Tables IV and V supply the referring metrics and question accuracy for the same model names.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2510.18262';
const caption = ['BLEU-1', 'BLEU-2', 'BLEU-3', 'BLEU-4', 'METEOR', 'ROUGE_L', 'CIDEr', 'SPICE'];
const referring = ['Acc@IoU_0.5', 'Acc@IoU_0.7', 'mIoU', 'Cum_IoU'];
const questions = ['Object Identification', 'Quantity & Existence', 'Position & Spatial Relations', 'Shape, Size & Form',
  'Color, Texture & Pattern', 'Object Attributes & Features', 'Scene & Environment', 'Substrate & Materials',
  'Water Quality & Visibility', 'Reasoning & Comparison', 'All'];
const partKeys = ['objectIdentification', 'quantityExistence', 'positionSpatial', 'shapeSizeForm', 'colorTexturePattern',
  'objectAttributes', 'sceneEnvironment', 'substrateMaterials', 'waterQuality', 'reasoningComparison', 'vqaAccuracy'];
const board: Leaderboard = {
  benchmark: 'uwbench', feed, url: feed, static: 'paper',
  terms: 'The authors publish the benchmark paper on arXiv. https://arxiv.org/abs/2510.18262',
  headline: 'The paper reports no overall score across tasks, so the headline is image captioning BLEU-1, its first metric.',
  parts: Object.fromEntries(questions.map((name, i) => [partKeys[i], { name: name === 'All' ? 'All VQA questions' : name, unit: '%' }])),
  aliases: { 'GLM-4.5V-106B': 'glm-4-5v', 'InternVL-3.5-241B': 'internvl3-5-241b-a28b',
    'Qwen3-VL-30B-Instruct': 'qwen3-vl-30b-a3b-instruct', 'Qwen3-VL-30B-Thinking': 'qwen3-vl-30b-a3b-thinking' },
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(feed));
    function read(columns: string[]) {
      const table = tables.find(t => t[0].join('|') === ['Method', ...columns].join('|'));
      if (!table) throw Error('Missing UWBench columns: ' + columns[0]);
      return new Map(table.slice(1).map(([model, ...cells]) => {
        if (cells.length !== columns.length) throw Error('Incomplete UWBench row: ' + model);
        return [model, cells] as const;
      }));
    }
    const refs = read(referring);
    const vqa = read(questions);
    const rows = [...read(caption)].map(([model, values]) => {
      const ref = refs.get(model), qa = vqa.get(model);
      if (!ref || !qa) throw Error('Missing UWBench task row: ' + model);
      const metrics: Record<string, number> = {};
      ['bleu1', 'bleu2', 'bleu3', 'bleu4', 'meteor', 'rougeL', 'cider', 'spice'].forEach((key, i) => { metrics[key] = numberCell(values[i]); });
      ['accIou05', 'accIou07', 'mIoU', 'cumulativeIoU'].forEach((key, i) => {
        if (ref[i] !== '/') metrics[key] = numberCell(ref[i]);
      });
      partKeys.forEach((key, i) => { metrics[key] = numberCell(qa[i]); });
      return { model, score: metrics.bleu1, metrics };
    });
    return checked(rows, 14);
  },
};
export default board;
