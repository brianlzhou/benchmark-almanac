// RuC checks whether generated Verilog preserves the original behavior.
// TuRTLe publishes average equivalence and syntax pass rates for each model and prompt mode.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard/raw/main/src/data/results_RuC_NST_32k.csv";

const board: Leaderboard = {
  benchmark: "ruc-tt07-32k",
  url: "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard",
  feed,
  terms: "The leaderboard Space carries the Apache 2.0 license. robots.txt allows the feed path.",
  async fetch() {
    const records = parseCsv((await fetchText(feed)).trim()).filter(r => r.Model !== 'Space');
    if (records.length < 14) throw new Error('Missing RuC runs');
    return records.map(r => {
      const metrics: Record<string, number> = {};
      for (const kind of ['STX', 'EQV']) {
        for (const part of ['INST','CONT','BLK','NBLK','CASE','COND','ALWS','PARAM','PORT','AVG']) {
          const key = part + ' (' + kind + ')', raw = r[key];
          if (!/^\d+(\.\d+)?%$/.test(raw ?? '')) throw new Error('Invalid RuC column: ' + key);
          metrics[key] = Number.parseFloat(raw);
          if (part !== 'AVG') (board.parts ??= {})[key] = { name: part, group: kind };
        }
      }
      if (!r.Model || !r['Prompt Mode']) throw new Error('Missing RuC model or mode');
      return { model: r.Model, setting: r['Prompt Mode'], score: metrics['AVG (EQV)'], metrics };
    });
  },
};
export default board;
