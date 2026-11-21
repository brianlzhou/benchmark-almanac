// MInDS-14 tests banking intent classification from speech. Table 1 reports mean accuracy across 14 language varieties.
// The authors average three independent runs for each encoder and training setup.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://aclanthology.org/2021.emnlp-main.591.pdf';
const board: Leaderboard = {
  benchmark: 'minds-14', static: 'paper', url: 'https://aclanthology.org/2021.emnlp-main.591/', feed,
  terms: 'The ACL Anthology publishes the paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.split('Table 1: Main results (Accuracy×100)')[0].split('\f').at(-1)!.trim().split('\n');
    if (section[0].trim().split(/\s+/).join('|') !== 'translate-to-EN|target-only|multilingual') throw new Error('Missing training setups');
    const modes = section[1].trim().split(/\s+/);
    const models = section[2].trim().split(/\s+/).slice(1);
    if (models.length !== 9 || modes.length !== 9) throw new Error('Missing encoders');
    const data = section.slice(3).filter(s => s.trim()).map(line => {
      const [name,...cells] = line.trim().replace(/EN\s*-\s*/,'EN-').split(/\s+/);
      if (cells.length !== 9) throw new Error('Incomplete language scores');
      return { name, values: cells.map(s => numberCell(s.replace(/[()]/g,''))) };
    });
    const average = data.pop();
    if (average?.name !== 'Average' || data.length !== 14) throw new Error('Missing languages or average');
    board.parts = Object.fromEntries(data.map(r => [r.name,r.name]));
    return checked(models.map((model,i) => ({
      model, trials: 3, setting: (i < 4 ? 'translate-to-EN' : i < 8 ? 'target-only' : 'multilingual') + ', ' + modes[i],
      score: average.values[i], metrics: Object.fromEntries(data.map(r => [r.name,r.values[i]]))
    })),9);
  },
};
export default board;
