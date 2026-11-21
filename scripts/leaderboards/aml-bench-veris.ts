// AML Bench tests whether agents resolve simulated anti-money-laundering investigations.
// The pass³ column reports pass^3.
// The Veris results table ranks pass@1 and gives intervals, task splits, tool use, cost and runtime.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://veris.ai/leaderboard/aml-bench";

const board: Leaderboard = {
  benchmark: "aml-bench-veris",
  url: "https://veris.ai/leaderboard/aml-bench",
  feed,
  terms: "Veris reserves all rights. Its dataset metadata points to https://veris.ai/terms-and-conditions. I found no public board reuse grant. Robots.txt allows the leaderboard path.",
  parts: { singleTurn: 'Single-turn', multiTurn: 'Multi-turn' },
  stats: {
    pass3: { name: 'Pass cubed', unit: '%', better: 'higher', note: 'Pass³ success rate reported by the benchmark.' },
    askedOnMultiTurn: { name: 'Asked on multi-turn', unit: 'count' },
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[0]?.text === 'Agent');
    const labels = ['Agent','pass@1','95% CI','pass³','Single-turn','Multi-turn','Asked on multi-turn','$/task','Harness'];
    if (!table || table.length < 15 || labels.some((v,i) => !table[0][i]?.text.replace('&sup3;', '³').startsWith(v))) throw new Error('AML Bench table changed');
    return table.slice(1).map(c => {
      const bounds = c[2].text.replace('&ndash;', '–').match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
      const latency = c[8].html.match(/median\s+([\d.]+)(?:&nbsp;|\s)+s/);
      const values = [1,3,4,5,6,7].map(i => num(c[i].text));
      if (!bounds || !latency || !c[0].text || !c[8].text || values.some(x => x === undefined)) throw new Error('Invalid AML Bench row');
      const [score, pass3, singleTurn, multiTurn, askedOnMultiTurn, cost] = values as number[];
      return { model: c[0].text, harness: c[8].text, score, low: +bounds[1], high: +bounds[2], cost, trials: 3,
        metrics: { pass3, singleTurn, multiTurn, askedOnMultiTurn, latency: +latency[1] } };
    });
  },
};

export default board;
