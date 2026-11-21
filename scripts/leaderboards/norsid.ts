// NorSID tests Norwegian intent, slot and dialect detection. The organizers rank each task separately.
// The headline is overall intent accuracy from results.md. Attach slot scores only for the same named system.
// HiTZ identifies its multitask models in https://aclanthology.org/2025.vardial-1.16/ (Table 5).
// CUFE identifies its intent model in https://aclanthology.org/2025.vardial-1.17/ (Section 4).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/ltgoslo/NoMusic/main/NorSID/results.md';
const dialects = ['Bokmål', 'Nordnorsk', 'Trøndersk', 'Vestnorsk'];
const hitz: Record<string, string> = { 'HITZ 1': 'EN', 'HITZ 2': 'EN+NB', 'HITZ 3': 'GER-NB' };
function task(text: string, name: string) {
  const section = text.split('## ' + name)[1]?.split('## ')[0];
  if (!section?.match(/System\s*\| B\s*\| N\s*\| T\s*\| V\s*\| Overall/)) throw new Error('Missing ' + name + ' columns');
  return new Map(section.split('\n').filter(line => /^\|\s*\d+\s*\|/.test(line)).map(line => {
    const [system, ...cells] = line.trim().split('|').slice(2, -1).map(c => c.trim());
    if (cells.length !== 5 || cells.some(c => !/^\d\.\d+$/.test(c))) throw new Error('Changed ' + name + ' row');
    return [system, cells.map(c => Number((Number(c) * 100).toFixed(2)))];
  }));
}
const board: Leaderboard = {
  benchmark: 'norsid', url: 'https://github.com/ltgoslo/NoMusic/blob/main/NorSID/results.md', feed,
  terms: 'The organizers publish these results at https://github.com/ltgoslo/NoMusic/tree/main/NorSID under the applicable repository terms.',
  headline: 'The organizers rank three tasks separately. The headline is overall accuracy on intent detection, the first task on the board.',
  parts: { slot: 'Slot detection F1', ...Object.fromEntries(dialects.flatMap((d, i) =>
    [[`intent${i}`, d + ' intent accuracy'], [`slot${i}`, d + ' slot F1']])) },
  async fetch() {
    const text = await fetchText(feed);
    const intents = task(text, 'Intent detection');
    const slots = task(text, 'Slot detection');
    const rows: LeaderboardRow[] = [];
    for (const [system, values] of intents) {
      const model = system.match(/\(([^)]+)\)/)?.[1] ?? (hitz[system] ? 'XLM-RoBERTa large' : system === 'CUFE 1' ? 'bert-base-multilingual-cased' : undefined);
      if (!model) throw new Error('Unknown intent submission ' + system);
      const metrics: Record<string, number> = {};
      const slot = slots.get(system);
      dialects.forEach((_, i) => {
        metrics['intent' + i] = values[i];
        if (slot) metrics['slot' + i] = slot[i];
      });
      if (slot) metrics.slot = slot[4];
      rows.push({ model, submitter: system.split(' ')[0], setting: hitz[system] ?? system.split(' (')[0], score: values[4], metrics });
    }
    return checked(rows, 11);
  },
};
export default board;
