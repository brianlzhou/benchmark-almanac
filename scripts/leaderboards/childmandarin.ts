// ChildMandarin tests speech recognition and speaker verification on children's Mandarin speech.
// The first task measures character error rate (%), lower is better. The README lists scratch and pretrained ASR systems.
// Table 6 of the paper adds the self-supervised systems. The verification experiments use different models and measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/flageval-baai/ChildMandarin/HEAD/README.md';
const paper = 'https://arxiv.org/html/2409.18584';
const board: Leaderboard = {
  benchmark: 'childmandarin', url: 'https://github.com/flageval-baai/ChildMandarin', feed,
  terms: 'The authors specify CC BY-NC-SA 4.0. https://creativecommons.org/licenses/by-nc-sa/4.0/',
  parts: { asr: { name: 'Automatic Speech Recognition', unit: '%', better: 'lower', note: 'Character error rate' } },
  async fetch() {
    const readme = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    function add(model: string, value: string, setting: string, params?: number) {
      if (value === '-') return;
      if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid character error rate for ' + model);
      rows.push({ model, score: Number(value), setting, params, metrics: { asr: Number(value) } });
    }
    const specifications = [
      { title: 'Models Trained from Scratch', header: ['Encoder', 'Loss', '# Params', 'Greedy', 'Beam', 'Attention', 'Attention Rescoring'] },
      { title: 'Fine-tuned Pre-trained Models', header: ['Model', '# Params', 'Zero-shot', 'Fine-tuning'] },
      { title: 'More Pre-trained Models', header: ['Model', '# Params', 'Zero-shot'] },
    ];
    for (const { title, header } of specifications) {
      const block = readme.split('#### ' + title)[1]?.trim().split(/\r?\n\s*\r?\n/)[0];
      const table = block?.split('\n').map(line => line.trim().slice(1, -1).split('|').map(cell => cell.trim()));
      if (table?.[0]?.join('|') !== header.join('|')) throw new Error('Missing ChildMandarin table ' + title);
      const index = header.indexOf('# Params');
      for (const row of table.slice(2)) {
        const size = row[index]?.replace(/,/g, '').match(/^([\d.]+)([MB])$/);
        if (!size || row.length !== header.length) throw new Error('Invalid ' + title + ' row');
        const params = Number(size[1]) / (size[2] === 'M' ? 1000 : 1);
        for (let i = index + 1; i < header.length; i++) {
          const setting = index === 2 ? row[1] + ', ' + header[i] : header[i];
          add(row[0], row[i], setting, params);
        }
      }
    }
    const ssl = paperTables(await paperHtml(paper)).map(grid).find(t => t[0]?.join('|') === 'Model|Greedy search|Beam search');
    if (!ssl) throw new Error('Missing ChildMandarin self-supervised ASR results');
    for (const [model, greedy, beam] of ssl.slice(1)) {
      add(model, greedy, 'Greedy search');
      add(model, beam, 'Beam search');
    }
    return checked(rows, 36);
  },
};
export default board;
