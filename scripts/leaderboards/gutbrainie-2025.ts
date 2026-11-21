// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// GutBrainIE tests entity and relation extraction from biomedical abstracts. The boards rank by micro F1.
// Sections 4.4 and 5 of the organizers' paper identify the two-stage baseline and Schemalink's GPT-4o system.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://hereditary.dei.unipd.it/challenges/gutbrainie/2025/';
const parts = { ner: 'NER', bt: 'BT-RE', tt: 'TT-RE', tm: 'TM-RE' };
const systems = [
  { team: 'BASELINE', run: 'Organizers', model: 'NuNerZero', models: ['NuNerZero', 'ATLOP'], harness: 'Organizers baseline' },
  { team: 'Schemalink', run: '1', model: 'GPT-4o', harness: 'Schema-based prompting' },
];
const board: Leaderboard = {
  benchmark: 'gutbrainie-2025', url: feed + '#six', feed, parts, harnesses: 'system',
  terms: 'The organizers publish these scores on the official challenge site. https://hereditary.dei.unipd.it/challenges/gutbrainie/2025/',
  async fetch() {
    const html = await fetchText(feed);
    const boards = tables(html).filter(t => t[0]?.map(c => c.text).join('|') === 'Team ID|Run ID|Macro-P|Macro-R|Macro-F1|Micro-P|Micro-R|Micro-F1');
    if (boards.length !== 4 || !boards.every((t, i) => t[1][1].text === ['2', '6219eedev3re', '6229eedev3re', '6239eedev3re'][i])) throw new Error('Unexpected GutBrainIE tables or order');
    return checked(systems.map(({ team, run, ...system }) => {
      const metrics: Record<string, number> = {};
      let sum = 0;
      Object.keys(parts).forEach((part, i) => {
        const row = boards[i].find(r => r[0].text === team && r[1].text === run);
        if (!row || row.length !== 8) throw new Error('Missing ' + team + ' result for ' + part);
        ['MacroP', 'MacroR', 'MacroF1', 'MicroP', 'MicroR', ''].forEach((suffix, j) => {
          const value = row[j + 2].text;
          if (!/^[01]\.\d+$/.test(value)) throw new Error('Invalid score for ' + team);
          metrics[part + suffix] = Number(value);
        });
        sum += metrics[part];
      });
      return { ...system, submitter: team === 'BASELINE' ? 'Organizers' : team, metrics, score: sum / 4 };
    }), 2);
  },
};
export default board;
