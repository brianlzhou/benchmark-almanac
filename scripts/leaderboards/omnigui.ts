// OmniGUI measures action prediction on phones. Overall Exact Match scores complete action predictions and reproduces the displayed ranking. Read all four measures from the HTML table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://omni-gui.github.io/#leaderboard";
const board: Leaderboard = {
  benchmark: "omnigui",
  url: "https://omni-gui.github.io/#leaderboard",
  feed: FEED,
  terms: "The footer credits the LVBench site template under CC BY-SA 4.0. It gives no separate terms for the score table. https://omni-gui.github.io/ The host has no published robots directives at /robots.txt.",
  parts: Object.fromEntries(['Localization','Semantic Understanding','Cross-modal Discrimination','Temporal Reasoning','Instant Response','Overall'].flatMap(group =>
    Object.entries({ TM: 'Type Match', EM: 'Exact Match', SR: 'Success Rate', GP: 'Goal Progress' }).map(([key,name]) => [group + ' ' + key, { name, group, unit: '%' }]))),
  aliases: { 'Gemini 3.0 Pro': 'gemini-3-pro', 'Gemini 3.0 Flash': 'gemini-3-flash' },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.[1]?.text === 'Model' && t[0].at(-1)?.text === 'Overall');
    if (!table || table.length < 11) throw new Error('Missing OmniGUI leaderboard');
    const groups = table[0].slice(2).map(c => c.text);
    const keys = groups.flatMap(group => ['TM','EM','SR','GP'].map(metric => group + ' ' + metric));
    if (keys.some(key => !board.parts![key]) || keys.length !== 24 || !table[1].every((c,i) => c.text === keys[i].split(' ').at(-1))) throw new Error('Unexpected OmniGUI columns');
    return table.slice(2).map(row => {
      if (!row[1]?.text || row.length !== 26) throw new Error('Incomplete OmniGUI row');
      const metrics = Object.fromEntries(keys.map((key,i) => [key, row[i+2].text === '' ? NaN : Number(row[i+2].text)]));
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid OmniGUI score');
      return { model: row[1].text, score: metrics['Overall EM'], metrics };
    });
  },
};
export default board;
