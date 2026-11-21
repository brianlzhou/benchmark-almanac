// QCircuitBench tests whether generated quantum circuits implement the specified algorithms.
// The headline is the average semantic score in Table 2. Table 1 reports syntax validity on the same tasks.
// Both tables print task-level uncertainty beneath each score row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2410.07961';
const board: Leaderboard = {
  benchmark: 'qcircuitbench', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { Llama3: 'llama-3-8b' },
  async fetch() {
    const html = await paperHtml(feed);
    const rows = new Map<string,LeaderboardRow>();
    const parts: Record<string,string> = { syntaxAverage: 'Average syntax score' };
    for (const [id,kind] of [['S4.T2','semantic'],['S4.T1','syntax']]) {
      const f = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      const t = f && flatPaperTables(f).map(grid)[0];
      if (!t || t[0].length !== 20 || t[0][1] !== 'Shot' || t[0].at(-1) !== 'Avg') throw Error('Missing ' + kind + ' table');
      for (let i = 1; i < t.length; i += 2) {
        const [model,shot,...values] = t[i];
        if (model === 'Human') continue;
        const uncertainty = t[i+1];
        if (uncertainty?.[0] !== model || uncertainty[1] !== shot) throw Error('Missing uncertainty row');
        const setting = shot + '-shot';
        const key = model + '|' + shot;
        const avg = numberCell(values.at(-1)!);
        const row = rows.get(key) ?? {model,setting,score:avg,metrics:{}};
        if (kind === 'syntax') row.metrics!.syntaxAverage = avg;
        for (const [j,name] of t[0].slice(2,-1).entries()) {
          const metric = kind + name.replace(/[^a-zA-Z0-9]/g,'');
          const error = uncertainty[j+2].match(/^\(±([\d.]+)\)$/);
          if (!error) throw Error('Unexpected uncertainty cell');
          parts[metric] = name + ' ' + kind;
          row.metrics![metric] = numberCell(values[j]);
          row.metrics![metric + 'Uncertainty'] = numberCell(error[1]);
        }
        rows.set(key,row);
      }
    }
    board.parts = parts;
    return checked([...rows.values()], 8);
  },
};
export default board;
