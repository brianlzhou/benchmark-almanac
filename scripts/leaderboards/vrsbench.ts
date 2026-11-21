// VRSBench evaluates captioning, grounding and question answering for remote sensing images.
// Table 3 at the catalog's leaderboard link gives accuracy over all visual questions under GPT-based grading.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/lx709/VRSBench/main/README.md';
const board: Leaderboard = {
  benchmark: 'vrsbench', url: 'https://github.com/lx709/VRSBench#visual-question-answering-performance', feed,
  terms: 'The authors release VRSBench text annotations under https://creativecommons.org/licenses/by/4.0/',
  stats: {
    'BLEU-1': { name: 'BLEU-1', unit: '%', better: 'higher' },
    'BLEU-2': { name: 'BLEU-2', unit: '%', better: 'higher' },
    'BLEU-3': { name: 'BLEU-3', unit: '%', better: 'higher' },
    'BLEU-4': { name: 'BLEU-4', unit: '%', better: 'higher' },
    METEOR: { name: 'METEOR', unit: '%', better: 'higher' },
    ROUGE_L: { name: 'ROUGE-L', unit: '%', better: 'higher' },
    CIDEr: { name: 'CIDEr', unit: '%', better: 'higher' },
    CLAIR: { name: 'CLAIR', unit: 'score', better: 'higher', note: 'GPT-based caption evaluation score from 0 to 1.' },
    Avg_L: { name: 'Average caption word length', unit: 'count' },
    'Acc@0.5 (Unique)': { name: 'Grounding accuracy at IoU 0.5 unique', unit: '%', better: 'higher' },
    'Acc@0.7 (Unique)': { name: 'Grounding accuracy at IoU 0.7 unique', unit: '%', better: 'higher' },
    'Acc@0.5 (Non Unique)': { name: 'Grounding accuracy at IoU 0.5 non-unique', unit: '%', better: 'higher' },
    'Acc@0.7 (Non Unique)': { name: 'Grounding accuracy at IoU 0.7 non-unique', unit: '%', better: 'higher' },
    'Acc@0.5 (All)': { name: 'Grounding accuracy at IoU 0.5 all', unit: '%', better: 'higher' },
    'Acc@0.7 (All)': { name: 'Grounding accuracy at IoU 0.7 all', unit: '%', better: 'higher' },
    All: { name: 'Visual question answering accuracy', unit: '%', better: 'higher' },
  },
  headline: 'The authors give no combined score. The headline is accuracy over all visual questions in Table 3.',
  async fetch() {
    const md = (await fetchText(feed)).replace(/^Mini-Gemini\s*\|/gm,'| Mini-Gemini |');
    const tables = markdownTables(md);
    const configs = new Map<string, LeaderboardRow>();
    const parts: Record<string,string> = {};
    for (const marker of ['BLEU-1','Acc@0.5 (Unique)','Category']) {
      const table = tables.find(t => t[0][0] === 'Method' && t[0][1] === marker);
      if (!table) throw new Error('Missing VRSBench table ' + marker);
      for (const [name,...cells] of table.slice(1)) {
        if (name === '# VQAs') continue;
        if (cells.length !== table[0].length-1) throw new Error('Incomplete VRSBench row');
        const model = name.replace(' w/o ft','');
        const row = configs.get(name) ?? { model, setting: name.endsWith(' w/o ft') ? 'Without fine-tuning' : undefined, score: NaN, metrics: {} };
        for (const [i,cell] of cells.entries()) {
          const key = table[0][i+1];
          if (!/^\d+(?:\.\d+)?$/.test(cell)) throw new Error('Invalid ' + key);
          row.metrics![key] = Number(cell);
          if (marker === 'Category') {
            if (key === 'All') row.score = Number(cell);
            else parts[key] = key;
          }
        }
        configs.set(name,row);
      }
    }
    board.parts = parts;
    return checked([...configs.values()],6);
  },
};
export default board;
