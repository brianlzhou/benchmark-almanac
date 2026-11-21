// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// SAM Audio-Bench evaluates prompted sound separation. The README's Models table gives subjective ratings
// for text prompting. Section 6.2 of the paper identifies the separate professional instrument test as MUSDB18.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/facebookresearch/sam-audio/HEAD/README.md';
const tasks = ['General SFX', 'Speech', 'Speaker', 'Music', 'Instr(wild)'];
const board: Leaderboard = {
  benchmark: 'sam-audio-bench', url: 'https://github.com/facebookresearch/sam-audio#models', feed,
  terms: 'The repository uses the SAM License, https://github.com/facebookresearch/sam-audio/blob/main/LICENSE.',
  headline: 'The headline averages listener ratings across the five SAM Audio-Bench tasks under text prompting.',
  parts: Object.fromEntries(tasks.map(task => [task, task])),
  async fetch() {
    const header = ['Model', ...tasks, 'Instr(pro)'].join('|');
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === header);
    if (!table) throw new Error('Missing SAM Audio subjective ratings table');
    return checked(table.slice(1).map(row => {
      const metrics = Object.fromEntries(tasks.map((task, i) => [task, numberCell(row[i + 1])]));
      const score = Object.values(metrics).reduce((a, b) => a + b) / tasks.length;
      return {model: row[0], score, metrics, setting: 'Text prompting'};
    }), 3);
  },
};
export default board;
