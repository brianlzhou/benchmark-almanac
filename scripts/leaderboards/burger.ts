// BURGER evaluates robotic drawing from language instructions. Figure 6 reports mean target similarity
// across training settings. We transcribed the labels twice and check each panel's SHA-256 before import.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const site = 'https://siyingzhao.github.io/BURGER/';
const figures = site + 'assets/figures/';
const panels = [
  { model: 'π0', file: 'fig6_pi0.webp', hash: 'af42b01e7cf75a487bcafba9ab76147a7fa43fc1f016e1dacfb0b85a081882b9',
    scores: [[0.203, 0.233, 0.321, 0.324], [0.324, 0.389, 0.384, 0.455], [0.464, 0.425, 0.518, 0.472]] },
  { model: 'π0.5', file: 'fig6_pi05.webp', hash: '89a345a91391d965b2e4e9f1f55a69e44cf00c63a194dc5c0983f461ccd3aa80',
    scores: [[0.212, 0.307, 0.340, 0.398], [0.327, 0.390, 0.446, 0.396], [0.458, 0.539, 0.499, 0.553]] },
  { model: 'π0-FAST', file: 'fig6_pi0fast.webp', hash: '264b42985ed888ed106350e83ca119addae72642f34843520e1d9b411048ee03',
    scores: [[0.407, 0.470, 0.476, 0.476], [0.469, 0.538, 0.563, 0.481], [0.353, 0.456, 0.477, 0.553]] },
];
const board: Leaderboard = {
  benchmark: 'burger', static: 'paper', url: site + '#scaling', feed: figures + panels[0].file,
  terms: 'The authors publish these charts on the project site. https://github.com/Qxjyqzw/BURGER#license',
  aliases: { 'π0': 'pi0', 'π0.5': 'pi0-5', 'π0-FAST': 'pi0-fast' },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const panel of panels) {
      if (rows.length) await new Promise(resolve => setTimeout(resolve, 1000));
      const settings = panel.scores.flatMap((series, i) => series.map((score, j) => ({
        model: panel.model, score, setting: [10, 30, 65, 132][j] + ' training classes, ' + [10, 50, 100][i] + ' demonstrations per class',
      })));
      rows.push(...await chartRows(figures + panel.file, panel.hash, settings));
    }
    return checked(rows, 36);
  },
};
export default board;
