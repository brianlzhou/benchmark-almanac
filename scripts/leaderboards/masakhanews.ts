// MasakhaNEWS tests topic classification in 16 languages. Table 3 gives supervised models' average weighted F1 over five runs.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://aclanthology.org/2023.ijcnlp-main.10.pdf';
const parts = {
  amh: 'Amharic', eng: 'English', fra: 'French', hau: 'Hausa', ibo: 'Igbo', lin: 'Lingala',
  lug: 'Luganda', orm: 'Oromo', pcm: 'Nigerian Pidgin', run: 'Rundi', sna: 'chiShona', som: 'Somali',
  swa: 'Kiswahili', tir: 'Tigrinya', xho: 'isiXhosa', yor: 'Yorùbá',
};
const board: Leaderboard = {
  benchmark: 'masakhanews', url: 'https://aclanthology.org/2023.ijcnlp-main.10/', feed, static: 'paper', parts,
  terms: 'ACL Anthology publishes this paper under its copyright policy at https://aclanthology.org/faq/copyright/.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 3: Baseline results')[0].split(/\f\s*Model\s+size\s+/).at(-1)!;
    const [header, ...lines] = table.trim().split('\n');
    if (header.trim().split(/\s+/).join('|') !== [...Object.keys(parts), 'AVG'].join('|')) throw new Error('Missing MasakhaNEWS Table 3 columns');
    const rows = lines.filter(l => l.trim() && !/^\s*(?:classical ML|multilingual text encoders|multilingual text-to-text LMs)\s*$/.test(l)).map(l => {
      const [model, size, ...cells] = l.trim().split(/\s+/);
      if (cells.length !== 17 || !/^(?:<20K|\d+M)$/.test(size)) throw new Error('Invalid MasakhaNEWS row: ' + l);
      const values = cells.map(numberCell);
      return { model, score: values[16], setting: 'Supervised', trials: 5,
        ...(size.endsWith('M') ? { params: parseInt(size) / 1000 } : {}),
        metrics: Object.fromEntries(Object.keys(parts).map((key, i) => [key, values[i]])) };
    });
    return checked(rows, 16);
  },
};
export default board;
