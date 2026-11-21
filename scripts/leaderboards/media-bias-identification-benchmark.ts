// MBIB tests media bias identification across eight tasks. The baseline README gives final macro and micro F1.
// Its first final score is macro F1. The preceding rankings give both measures for each task.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/Media-Bias-Group/MBIB/main/baseline/README.md';
const board: Leaderboard = {
  benchmark: 'media-bias-identification-benchmark', feed, url: 'https://github.com/Media-Bias-Group/MBIB/tree/main/baseline',
  terms: 'GPL 3.0. https://github.com/Media-Bias-Group/MBIB/blob/main/LICENSE',
  async fetch() {
    const source = (await fetchText(feed)).split('## Result analysis')[1];
    const [detail, final] = (source ?? '').split('This results into the following final MBIB scores:');
    const table = (s: string) => s.split('\n').filter(l => l.startsWith('|')).map(l => l.split('|').slice(1, -1).map(c => c.trim()));
    if (!final || table(final)[0]?.join('|') !== 'Model|Final Macro-Score|Final Micro-Score') throw Error('Missing MBIB final scores');
    const parts: Record<string, BoardPart> = {};
    const models = new Map<string, Record<string, number>>();
    const normalize = (s: string) => s.toLowerCase().replace(/[&\s-]/g, '');
    let task = '';
    for (const [label, rank, macroModel, macro, , microModel, micro] of table(detail)) {
      if (!/^\d+$/.test(rank)) continue;
      if (label) task = label;
      for (const [name, key, value] of [[macroModel, 'Macro F1', macro], [microModel, 'Micro F1', micro]]) {
        if (!task || !/^0\.\d+$/.test(value)) throw Error('Invalid MBIB task score');
        const id = normalize(name);
        const metrics = models.get(id) ?? {};
        const part = task + ' ' + key;
        parts[part] = { name: task, group: key };
        metrics[part] = Number(value);
        models.set(id, metrics);
      }
    }
    board.parts = parts;
    return checked(table(final).slice(2).map(([model, macro, micro]) => {
      const metrics = models.get(normalize(model));
      if (!metrics || Object.keys(metrics).length !== 16 || ![macro, micro].every(v => /^0\.\d+$/.test(v))) throw Error('Incomplete MBIB results for ' + model);
      return { model, score: Number(macro), metrics: { ...metrics, microF1: Number(micro) } };
    }), 5);
  },
};
export default board;
