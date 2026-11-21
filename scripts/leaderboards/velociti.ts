// VELOCITI measures whether a video model identifies both the true and false captions in a pair.
// The full StrictVLE leaderboard reports average accuracy and scores for eight tests.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://katha-ai.github.io/projects/velociti/';
const parts = { control: 'Control', agentRandom: 'Agent Random', agentBinding: 'Agent Binding',
  agentCoreference: 'Agent Coreference', actionAdversarial: 'Action Adversarial', actionMannerism: 'Action Mannerism',
  actionBinding: 'Action Binding', eventChronology: 'Event Chronology' };
const board: Leaderboard = {
  benchmark: 'velociti', url: feed + '#leaderboard', feed, parts,
  terms: 'The authors license VELOCITI under CC BY-NC-SA 4.0. https://creativecommons.org/licenses/by-nc-sa/4.0/',
  aliases: { 'V-LLaVA': 'video-llava-7b', 'OV-7B': 'llava-onevision-7b', 'OV-72B': 'llava-onevision-72b', 'QVL-7B': 'qwen2-vl-7b-instruct' },
  async fetch() {
    const html = await fetchText(feed);
    const full = html.match(/<table\b[^>]*\bid="leaderboard"[^>]*>[\s\S]*?<\/table>/i)?.[0];
    const table = full && grid(tables(full)[0]);
    const header = ['Model', ...Object.values(parts), 'Average'];
    if (!table || !header.every((name, i) => table[0]?.[i] === name)) throw new Error('Missing full StrictVLE table');
    return checked(table.slice(1).filter(([model]) => model !== 'Random' && !/^Human/i.test(model)).map(([model, ...cells]) => {
      if (cells.length !== 9 || cells.some(c => !/^\d+(?:\.\d+)?$/.test(c))) throw new Error('Invalid StrictVLE scores for ' + model);
      const metrics = Object.fromEntries(Object.keys(parts).map((key, i) => [key, Number(cells[i])]));
      return { model, score: Number(cells[8]), metrics };
    }), 6);
  },
};
export default board;
