// Berkeley Function Calling Leaderboard. gorilla.cs.berkeley.edu/leaderboard.html loads data_overall.csv
// (BFCL V4, the only version the page shows; "Last Updated" 2026-04-12 at the time of writing). The
// headline is "Overall Acc", a percentage string. Each model name ends in its calling mode: "(FC)" for
// native function calling or "(Prompt)" for prompted calls, sometimes with a thinking flag; the mode goes
// to `harness` and the thinking flag to `setting`.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://gorilla.cs.berkeley.edu/data_overall.csv';

const board: Leaderboard = {
  benchmark: 'berkeley-function-calling-leaderboard-bfcl',
  url: 'https://gorilla.cs.berkeley.edu/leaderboard.html',
  feed: FEED,
  terms: 'Static CSV on the Gorilla project site; the gorilla repository (ShishirPatil/gorilla) is Apache-2.0.',
  aliases: {},
  async fetch() {
    return parseCsv(await fetchText(FEED))
      .filter((r) => r.Model && /%$/.test(r['Overall Acc']))
      .map((r) => {
        const mode = r.Model.match(/\s*\(((FC|Prompt)\b[^)]*)\)\s*$/);
        const name = mode ? r.Model.slice(0, mode.index).trim() : r.Model.trim();
        const thinking = mode && /thinking/i.test(mode[1]) ? 'thinking' : undefined;
        return {
          model: name,
          score: parseFloat(r['Overall Acc']),
          setting: thinking,
          harness: mode ? (mode[2] === 'FC' ? 'native function calling' : 'prompted') : undefined,
        };
      });
  },
};
export default board;
