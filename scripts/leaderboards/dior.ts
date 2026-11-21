// DIOR tests object detection in optical remote sensing images. Table 3 reports
// mean average precision across 20 classes and average precision for each class.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/1909.00133';
const classes = ['Airplane', 'Airport', 'Baseball field', 'Basketball court', 'Bridge', 'Chimney', 'Dam',
  'Expressway service area', 'Expressway toll station', 'Golf course', 'Ground track field', 'Harbor',
  'Overpass', 'Ship', 'Stadium', 'Storage tank', 'Tennis court', 'Train station', 'Vehicle', 'Wind mill'];
export default {
  benchmark: 'dior', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/1909.00133',
  parts: Object.fromEntries(classes.map((name,i) => ['c' + (i + 1), name])),
  async fetch() {
    const paper = (await pdfText(feed)).replaceAll('‐','-');
    const table = paper.split('Detection average precision (%) of 12 representative methods')[1]?.split('\f')[0];
    const body = table?.split(/Backbone\s+c1\s+c2[^\n]+c20\s+mAP/)[1];
    if (!body || !table?.includes('Expressway toll station')) throw new Error('Missing DIOR Table 3 columns');
    // Poppler places some spanning method labels between their two backbone rows.
    const lines = body.replace(/(ResNet-50[^\n]+)\n\s*(RetinaNet|PANet)\s*\n\s*(ResNet-101)/g,'$2 $1\n$2 $3')
      .replace(/Hourglass-\s*\n\s*CornerNet\s+([^\n]+)\n\s*104/,'CornerNet Hourglass-104 $1')
      .split('\n').map(line => line.trim()).filter(Boolean);
    let previous = '';
    const rows = lines.map(line => {
      const m = line.match(/^(.+?)\s+(VGG16|Darknet-53|ResNet-(?:50|101)|Hourglass-104)\s+(.+)$/);
      if (!m) throw new Error('Invalid detector row: ' + line);
      let model = m[1];
      if (model === 'with FPN') model = previous;
      else if (model === 'Faster RCNN' || model === 'Mask-RCNN') model += ' with FPN';
      previous = model;
      const values = m[3].split(/\s+/).map(Number);
      if (values.length !== 21 || !values.every(Number.isFinite)) throw new Error('Invalid AP values: ' + line);
      return {model, setting: m[2], score: values[20],
        metrics: Object.fromEntries(classes.map((_,i) => ['c' + (i + 1), values[i]]))};
    });
    return checked(rows,16);
  },
} satisfies Leaderboard;
