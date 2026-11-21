// VS-Bench tests game perception, next-action prediction and decision-making.
// The authors give two accuracies and a normalized episode return. The first table supplies the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://vs-bench.github.io/';
const games = ['Hanabi','Overcooked','KAZ','Board','Poker','Pong','MPE','Dilemma','Hunt','Battle'];
const abilities = ['Perception','Strategic Reasoning','Decision-Making'];
const parts = Object.fromEntries(abilities.flatMap(a => [[a,a], ...games.map(g => [a+g, a+': '+g])]));
const thinkingOff: Record<string,string> = { 'gemini-2.5 w/o thinking': 'gemini-2.5-pro', 'claude-3-7 w/o thinking': 'claude-3-7-sonnet' };
const board: Leaderboard = {
  benchmark: 'visual-strategic-bench', url: feed+'#benchmark-results', feed, parts,
  terms: 'CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  headline: 'The headline is overall perception accuracy, the first of the three abilities tested.',
  aliases: { 'Qwen2.5-VL-72B-Ins.': 'qwen2-5-vl-72b', 'Llama-3.2-90B-Vision-Ins.': 'llama-3-2-90b' },
  async fetch() {
    const html = await fetchText(feed);
    const models = new Map<string,LeaderboardRow>();
    for (const ability of abilities) {
      const section = html.split('<h3>'+ability+'</h3>')[1]?.split('<h3>')[0];
      const t = section && tables(section)[0];
      if (!t || t[0][1]?.text !== 'Overall' || t[1].map(c=>c.text).join('|') !== games.join('|')) throw new Error('Missing '+ability+' table');
      for (const cells of t.slice(2)) {
        const [name,...scores] = cells.map(c=>c.text);
        if (name === 'Oracle' || name === 'Random') continue;
        if (scores.length !== 11 || !scores.every(v=>/^-?\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid '+ability+' row');
        const row = models.get(name) ?? { model: thinkingOff[name] ?? name, setting: name in thinkingOff ? 'Thinking off' : undefined, score: 0, metrics: {} };
        if (ability === 'Perception') row.score = Number(scores[0]);
        if (ability in row.metrics!) throw new Error('Repeated '+ability+' row');
        row.metrics![ability] = Number(scores[0]);
        games.forEach((g,i) => { row.metrics![ability+g] = Number(scores[i+1]); });
        models.set(name,row);
      }
    }
    const rows = [...models.values()];
    if (rows.some(r => abilities.some(a => !(a in r.metrics!)))) throw new Error('Incomplete VS-Bench row');
    return checked(rows,15);
  },
};
export default board;
