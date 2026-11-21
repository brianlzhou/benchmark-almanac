// EgoProceVQA measures understanding of first-person procedures. The project page's Avg column excludes temporal grounding.
// The main table separates frame counts and reports grounding alongside the other tasks.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://raw.githubusercontent.com/z1oong/EgoProceVQA/main/index.html";
const keys = ['KSR', 'PSR', 'KSG', 'KSO', 'KSM', 'TC', 'longGrounding', 'shortGrounding', 'long', 'short'];

const board: Leaderboard = {
  benchmark: "egoprocevqa",
  url: "https://z1oong.github.io/EgoProceVQA/#table-main",
  feed,
  terms: "The website credits an adapted CC BY-SA 4.0 template. It does not state separate reuse terms for the scores. The host has no robots.txt.",
  harnesses: 'system',
  parts: { KSR: 'KSR', PSR: 'PSR', KSG: { name: 'KSG', unit: 'score' }, KSO: 'KSO', KSM: 'KSM', TC: 'TC',
    longGrounding: { name: '≥20s (G)', unit: 'score' }, shortGrounding: { name: '<20s (G)', unit: 'score' }, long: '≥20s', short: '<20s' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Model|Frame|KSR|PSR|KSG|KSO|KSM|TC|&ge;20s (G)|<20s (G)|&ge;20s|<20s|Avg');
    if (!table) throw new Error('Missing main results');
    const rows = table.slice(1).filter(r => r.length > 1 && !['Human', 'Random'].includes(r[0].text)).map(row => {
      const [label, frame, ...cells] = row.map(c => c.text);
      const numbers = cells.map(parseFloat);
      if (numbers.length !== 11 || !numbers.every(Number.isFinite)) throw new Error('Missing EgoProceVQA scores');
      const agent = label.match(/^Ours \((.+)\)$/);
      return { model: agent?.[1] ?? label, setting: frame + ' frames', score: numbers[10], harness: agent ? 'Self-Skill-Exploration Agent' : undefined,
        metrics: Object.fromEntries(keys.map((k, i) => [k, numbers[i]])) };
    });
    if (rows.length < 24) throw new Error('Missing model or frame settings');
    return rows;
  },
};
export default board;
