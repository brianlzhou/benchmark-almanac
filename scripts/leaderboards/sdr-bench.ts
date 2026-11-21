// SDR-Bench measures weighted coverage of the points in successful sales outreach.
// The authors' results table reports aggregate coverage and sector scores for Search and Direct runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const url = 'https://behavior-in-the-wild.github.io/SDR-Bench.html';
const sectors = ['Tech.', 'Mfg.', 'Energy', 'IT'];
const board: Leaderboard = {
  benchmark: 'sdr-bench', url, feed: url,
  terms: 'Public results on the study website, which links CC BY-SA 4.0.',
  parts: Object.fromEntries(sectors.map(s => [s, s])),
  async fetch() {
    const t = tables(await fetchText(url)).find(t => t[0]?.[1]?.text === 'SDR-Bench Success Stories');
    if (!t || ![...sectors, 'Agg.'].every((s, i) => s === t[1][i].text)) throw new Error('Missing SDR-Bench columns');
    let setting = '';
    const rows: LeaderboardRow[] = [];
    for (const c of t.slice(2)) {
      if (c.length === 1) { setting = c[0].text; continue; }
      if (!setting || c.length !== 9 || !c.slice(1).every(x => x.text && Number.isFinite(Number(x.text)))) throw new Error('Invalid SDR-Bench row');
      const metrics = Object.fromEntries(t[1].flatMap((h, i) => i === 4 ? [] : [[h.text, Number(c[i + 1].text)]]));
      rows.push({ model: c[0].text, setting, score: Number(c[5].text), metrics });
    }
    if (rows.length < 14) throw new Error('Incomplete SDR-Bench results');
    return rows;
  },
};
export default board;
