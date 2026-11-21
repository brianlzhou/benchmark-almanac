// NotSoTiny checks generated Verilog modules for functional equivalence. The TuRTLe Space ranks models by the
// unweighted mean of the seven collection equivalence rates in its two-header CSV.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard/raw/main/src/data/results_NotSoTiny-25-12.csv";

const board: Leaderboard = {
  benchmark: "notsotiny-25-12",
  url: "https://huggingface.co/spaces/HPAI-BSC/TuRTLe-Leaderboard",
  feed,
  terms: "The leaderboard Space carries the Apache 2.0 license. robots.txt allows the feed path.",
  async fetch() {
    const lines = (await fetchText(feed)).trim().split(/\r?\n/).filter(line => line.trim());
    const collections = lines[0].split(',').map(s => s.trim());
    const headings = lines[1].split(',').map(s => s.trim());
    const groups = collections.flatMap((name, index) => name ? [{ name, index }] : []);
    if (groups.length !== 7 || groups.some(g => !/EQV/.test(headings[g.index + 1])) || lines.length < 17)
      throw new Error('Unexpected NotSoTiny score columns or models');
    board.parts = Object.fromEntries(groups.map(g => [g.name, g.name]));
    return lines.slice(2).map(line => {
      const cells = line.split(',');
      const metrics: Record<string, number> = {};
      let total = 0;
      for (const { name, index } of groups) {
        for (const [offset, suffix] of ['Syntax', '', 'Coverage mean', 'Coverage median'].entries()) {
          const value = cells[index + offset]?.trim();
          if ((value === '-' || value === '') && offset > 1) continue;
          if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid ' + name + ' score');
          metrics[suffix ? name + ' ' + suffix : name] = Number(value);
        }
        total += metrics[name];
      }
      return { model: cells[0].trim(), score: total / groups.length, metrics };
    });
  },
};
export default board;
