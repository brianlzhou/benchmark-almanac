// MatCha tests visual understanding of materials characterization images. Accuracy covers 1,500 questions.
// Table 1 and Tables 4 through 8 give overall and category accuracies under six prompting settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2509.09307';
const parts = { pc: 'Processing correlation', ma: 'Morphology analysis', sa: 'Structure analysis',
  pa: 'Property analysis', generated: 'Generated VQA', sma: 'Supplementary surface microstructure analysis',
  dtc: 'Supplementary defect type classification', ica: 'Supplementary image content analysis', converted: 'Converted VQA' };
const settings: Record<string, string> = { 1: 'Zero-shot', 4: '2-shot', 5: '4-shot', 6: '8-shot', 7: '16-shot', 8: 'Chain of thought' };
const board: Leaderboard = {
  benchmark: 'matcha', feed, url: feed, static: 'paper', terms: PAPER_TERMS + ' https://arxiv.org/licenses/', parts,
  aliases: { 'LLaVA-1.5-7B': 'llava-v1-5-7b' },
  async fetch() {
    const paper = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [number, setting] of Object.entries(settings)) {
      const figure = paper.match(new RegExp('<figure\\b[^>]*\\bid="[^"]*\\.T' + number + '"[\\s\\S]*?</figure>'))?.[0];
      const table = figure && flatPaperTables(figure.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/g, '')).map(grid)
        .find(t => t[0]?.at(-1) === 'MatCha' && t[1]?.join('|') === 'Model|PC|MA|SA|PA|All|Suppl. SMA|Suppl. DTC|Suppl. ICA|All|All');
      if (!table) throw Error('Missing MatCha table for ' + setting);
      for (const [model, ...cells] of table.slice(2)) {
        if (model === 'Human' || model === 'Random Choice' || cells.every(v => v === model)) continue;
        if (cells.length !== 10 || cells.some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw Error('Invalid MatCha scores for ' + model);
        rows.push({ model, setting, score: Number(cells[9]), metrics: Object.fromEntries(Object.keys(parts).map((k, i) => [k, Number(cells[i])])) });
      }
    }
    return checked(rows, 90);
  },
};
export default board;
