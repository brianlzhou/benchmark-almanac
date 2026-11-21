// rTaste tests whether agents select useful experiments before seeing their outcomes.
// The Results table reports the mean number of five experiments judged sound, valuable and new per seed paper.
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import type { Leaderboard } from './types.ts';
const url = 'https://github.com/ArtKanke/rTaste';
const feed = 'https://raw.githubusercontent.com/ArtKanke/rTaste/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'rtaste', url, feed, terms: 'The authors release the data under CC BY 4.0. https://github.com/ArtKanke/rTaste#license',
  stats: {
    beyondNonObvious: {name: 'Beyond the paper, non-obvious', unit: 'count', better: 'higher'},
    informativeEvidence: {name: 'Informative evidence', unit: '%', better: 'higher', note: 'Percentage of sound experiments with informative evidence.'},
    registeredEventOccurred: {name: 'Registered event occurred', unit: '%', better: 'higher', note: 'Percentage of sound experiments where the registered event occurred.'},
    soundValuableNewPer100USD: {name: 'Sound, valuable and new per $100', unit: 'count', better: 'higher'},
    seedPapers: {name: 'Seed papers', unit: 'count'},
  },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0][0] === 'Model (SR / RT)');
    if (!table || table[0].slice(1).join('|') !== 'Sound, valuable and new, of five|Beyond the paper, non obvious|Informative evidence, % of sound|Registered event occurred, % of sound|Sound, valuable and new per $100') throw new Error('Missing rTaste Results columns');
    const rows = table.slice(1).filter(r => !['All', 'RT minus SR'].includes(r[0])).flatMap(([label, ...cells]) => {
      const values = cells.map(cell => cell.split(' / ').map(numberCell));
      if (values.length !== 5 || values.some(pair => pair.length !== 2)) throw new Error('Invalid SR / RT pair');
      return ['Single researcher', 'Research team'].map((harness, i) => {
        const [score, beyondNonObvious, informativeEvidence, registeredEventOccurred, soundValuableNewPer100USD] = values.map(pair => pair[i]);
        return {model: label.replace('†', ''), harness, score, metrics: {beyondNonObvious, informativeEvidence,
          registeredEventOccurred, soundValuableNewPer100USD, seedPapers: i === 0 && label.includes('†') ? 6 : 7}};
      });
    });
    return checked(rows, 12);
  },
};
export default board;
