// ChemArgus tests chemistry reasoning with competition and textbook problems. The authors' leaderboard
// snapshot reports normalized rubric credit as a percentage for each input mode and context protocol.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://huggingface.co/datasets/CosmosMind/ChemArgus/raw/main/README.md';
const protocols = ['full_problem', 'sequential_carry', 'oracle_scaffolded'];
const board: Leaderboard = {
  benchmark: 'chemargus', url: 'https://www.cosmosmind.ai/leaderboard/chemargus', feed,
  terms: 'CosmosMind publishes the scores on Hugging Face. https://huggingface.co/terms-of-service',
  async fetch() {
    const source = await fetchText(feed);
    const header = '| Model | Input | ' + protocols.join(' | ') + ' |';
    const table = source.split(header)[1]?.trimStart().split(/\r?\n\s*\r?\n/)[0];
    if (!table) throw new Error('Missing ChemArgus leaderboard columns');
    const rows = table.split(/\r?\n/).slice(1).flatMap(line => {
      const [model,input,...scores] = line.trim().slice(1,-1).split('|').map(cell => cell.trim());
      if (!model || !input || scores.length !== 3 || scores.some(s => !/^\d+(\.\d+)?$/.test(s))) throw new Error('Invalid ChemArgus row');
      return scores.map((s,i) => ({ model, setting: input + ', ' + protocols[i], score: Number(s) }));
    });
    return checked(rows, 75);
  },
};
export default board;
