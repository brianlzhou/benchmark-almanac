// GIFT-Eval compares forecasting methods. Its overall table groups entries by test leakage and sorts each group by mean MASE rank, lower first.
// The live Space configuration contains the overall table and four breakdowns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://salesforce-gift-eval.hf.space/config";

type Table = { headers: string[]; data: (string | number | null)[][] };

const board: Leaderboard = {
  benchmark: "gift-eval",
  url: "https://huggingface.co/spaces/Salesforce/GIFT-Eval",
  feed: FEED,
  terms: "The Space lists apache-2.0 for its repository. https://huggingface.co/spaces/Salesforce/GIFT-Eval/blob/main/README.md",
  async fetch() {
    const config = await fetchJson<{components: {type: string; props: {value: Table}}[]}>(FEED);
    const grids = config.components.filter(c => c.type === 'leaderboard').map(c => c.props.value);
    if (grids.length !== 5 || grids[0].data.length < 173) throw new Error('Incomplete GIFT-Eval tables');
    const rows = new Map<string, LeaderboardRow>();
    this.parts = {};
    for (const [i, grid] of grids.entries()) {
      const group = ['Overall','Domain','Frequency','Term Length','Variate Type'][i];
      if (grid.headers[1] !== 'model' || (!i && grid.headers[11] !== 'MASE_Rank')) throw new Error('Unexpected GIFT-Eval columns');
      for (const cells of grid.data) {
        const raw = String(cells[1]);
        if (!i) {
          const model = text(raw).replace(/\s*\(\s*code\s*\)\s*$/i,'');
          const link = raw.match(/href="(https?:\/\/[^"]+)"/)?.[1];
          const score = cells[11];
          if (!model || typeof score !== 'number') throw new Error('Missing overall MASE rank');
          rows.set(raw,{model, score, setting: 'Test Leak.: ' + cells[8], link, submitter: cells[7] && cells[7] !== '?' ? String(cells[7]) : undefined, license: cells[4] !== '?' ? String(cells[4]) : undefined, params: Number(cells[6]) || undefined, metrics: {}});
        }
        const row = rows.get(raw);
        if (!row) throw new Error('Unknown GIFT-Eval model: ' + raw);
        for (let j=10; j<grid.headers.length; j++) {
          const v = cells[j];
          if (v == null || String(v).trim() === '' || !Number.isFinite(Number(v))) continue;
          const key = grid.headers[j];
          row.metrics![key] = Number(v);
          if (i) this.parts[key] = {name: key, group, better: 'lower'};
        }
      }
    }
    return [...rows.values()];
  },
};
export default board;
