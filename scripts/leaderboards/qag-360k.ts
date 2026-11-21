// QAG-360K tests question answering and change localization in paired remote-sensing images.
// Table 2 reports overall answer accuracy plus text and segmentation scores for all eight question types.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2410.23828';
const names = { CN: 'Change or not', CtW: 'Change to what', CfW: 'Change from what', IN: 'Increase or not',
  DN: 'Decrease or not', LC: 'Largest change', SC: 'Smallest change', CR: 'Change ratio' };
const parts: Record<string, BoardPart> = {};
for (const [tag, name] of Object.entries(names)) {
  parts['text' + tag] = { name, group: 'Textual answer accuracy' };
  parts['visual' + tag] = { name, group: 'Visual answer IoU' };
}
export default {
  benchmark: 'qag-360k', static: 'paper', url, feed: url, parts,
  stats: { textAA: { name: 'Text answer accuracy', unit: '%', better: 'higher' }, textOA: { name: 'Text overall accuracy', unit: '%', better: 'higher' }, visualmIoU: { name: 'Visual mean IoU', unit: '%', better: 'higher' }, visualoIoU: { name: 'Visual overall IoU', unit: '%', better: 'higher' } },
  headline: 'The headline is overall textual answer accuracy on QAG-360K.',
  terms: 'The authors publish their benchmark under CC BY-NC 4.0. https://github.com/like413/VisTA#license',
  async fetch() {
    const t = paperTables(await paperHtml(url)).map(grid).find(t => t[0]?.[0] === 'Method' && t.some(r => r[0] === 'Visual Answer' && r[1] === 'oIoU'));
    if (!t || t[2][0] !== 'Backbone') throw new Error('Missing QAG-360K comparison table');
    return checked(t[0].slice(2).map((label, i) => {
      const metrics: Record<string, number> = {};
      for (const [group, code, ...cells] of t.slice(3)) {
        if (group !== 'Textual Answer' && group !== 'Visual Answer') continue;
        const s = cells[i];
        if (!/^\d+\.\d+$/.test(s)) throw new Error('Missing score for ' + label);
        metrics[(group === 'Textual Answer' ? 'text' : 'visual') + code] = Number(s);
      }
      if (![...Object.keys(parts), 'textOA', 'textAA', 'visualmIoU', 'visualoIoU'].every(k => k in metrics)) throw new Error('Missing metrics');
      const shared = label.startsWith('\\dagger');
      const model = label.replace('\\dagger', '');
      const setting = t[2][i+2] + (shared ? ', two weight-shared visual backbones' : '');
      return { model, setting, score: metrics.textOA, metrics };
    }), 9);
  },
} satisfies Leaderboard;
