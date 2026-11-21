// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 1 measures how well synthesized speech reproduces each speaker's prosody. The paper ranks the four systems by P-MOS.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2610.19774';
const languages = ['Chinese', 'English'];
const measures = ['WER/CER', 'SIM-O', 'SRD', 'PD', 'PCC', 'IC', 'PRD', 'MPM-SIM', 'AutoPCP', 'P-MOS'];
const lower = new Set(['WER/CER', 'SRD', 'PD', 'PRD']);
const parts: Record<string, BoardPart> = {};
for (const language of languages) {
  for (const name of measures) parts[language + ' ' + name] = {
    name, group: language, unit: name === 'WER/CER' ? '%' : 'score', better: lower.has(name) ? 'lower' : 'higher',
  };
}
const board: Leaderboard = {
  benchmark: 'lp-tts-bench', url: feed, feed, static: 'paper', parts,
  terms: 'The authors list the license at https://arxiv.org/abs/2610.19774.',
  headline: 'This is the plain mean of Chinese and English P-MOS, the listener ratings of prosodic similarity.',
  async fetch() {
    const expected = measures.map(m => m + (lower.has(m) ? ' \\downarrow' : ' \\uparrow'));
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.[1] === 'Target Spk. SFT?' && t[1]?.slice(2).join('|') === expected.join('|'));
    if (!table) throw new Error('Missing bilingual speech synthesis scores');
    const models = new Map<string, LeaderboardRow>();
    let language = '';
    for (const row of table.slice(2)) {
      if (languages.includes(row[0]) && row.every(c => c === row[0])) {
        language = row[0];
        continue;
      }
      const [model, sft, ...cells] = row;
      if (!language || cells.length !== measures.length || !['\\times', '\\checkmark'].includes(sft)) throw new Error('Invalid speech score row');
      const result = models.get(model) ?? { model, setting: sft === '\\times' ? 'Zero-shot' : 'Target speaker fine-tuning', score: 0, metrics: {} };
      if (language + ' P-MOS' in result.metrics!) throw new Error('Duplicate language for ' + model);
      measures.forEach((name, i) => { result.metrics![language + ' ' + name] = numberCell(cells[i]); });
      models.set(model, result);
    }
    for (const row of models.values()) row.score = (row.metrics!['Chinese P-MOS'] + row.metrics!['English P-MOS']) / 2;
    return checked([...models.values()], 4);
  },
};
export default board;
