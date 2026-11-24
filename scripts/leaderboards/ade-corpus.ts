// The ADE Corpus tests extraction of drug and adverse-effect relations. The archived leaderboard
// ranks models by strict relation extraction macro-F1 (RE+). Convert its 0 to 100 numbers to F1 on 0 to 1.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.codewithpapers.app/sota/relation-extraction-on-ade-corpus';
type Entry = { model: string; paper_url?: string; metrics: Record<string, string> };
const board: Leaderboard = {
  benchmark: 'ade-corpus', host: 'Code with Papers', feed: url + '.json', url,
  terms: 'Papers with Code archive, modified by Syntology, CC BY-SA 4.0. https://codewithpapers.app/attribution',
  stats: {
    strictF1: { name: 'Strict relation extraction F1', unit: 'score', better: 'higher', note: 'Macro-F1 for exact relation extraction, from 0 to 1.' },
    relationF1: { name: 'Relation extraction F1', unit: 'score', better: 'higher', note: 'Macro-F1 for relation extraction, from 0 to 1.' },
    entityF1: { name: 'Entity recognition F1', unit: 'score', better: 'higher', note: 'Macro-F1 for named entity recognition, from 0 to 1.' },
  },
  async fetch() {
    const data = await fetchJson<{ dataset: { name: string }; metrics: string[]; rows: Entry[] }>(board.feed);
    if (data.dataset.name !== 'Adverse Drug Events (ADE) Corpus' || data.metrics[0] !== 'RE+ Macro F1') throw new Error('Missing ADE relation extraction leaderboard');
    return checked(data.rows.map(row => {
      const metrics: Record<string, number> = {};
      for (const [name, key] of [['RE+ Macro F1', 'strictF1'], ['RE Macro F1', 'relationF1'], ['NER Macro F1', 'entityF1']]) {
        if (!Object.hasOwn(row.metrics, name)) continue;
        const match = row.metrics[name].match(/^(\d+(?:\.\d+)?)(?:\s*±\s*(\d+(?:\.\d+)?))?$/);
        if (!match) throw new Error('Unexpected ' + name + ' for ' + row.model);
        metrics[key] = Number(match[1]) / 100;
        if (match[2]) metrics[key === 'strictF1' ? 'std' : key + 'Std'] = Number(match[2]) / 100;
      }
      const label = row.model.match(/^(.+) \(([^()]*)\)$/);
      return { model: label?.[1] ?? row.model, setting: label?.[2], score: metrics.strictF1, metrics, link: row.paper_url };
    }), 15);
  },
};
export default board;
