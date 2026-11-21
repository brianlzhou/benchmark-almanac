// EmbodiedLab tests whether agents can conduct experiments in a simulated laboratory.
// The official leaderboard ranks native-control success rates over all 35 experiments and gives tokens per run.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/HexaFuture/EmbodiedLab/HEAD/README.md';
const board: Leaderboard = {
  benchmark:'embodiedlab', url:'https://github.com/HexaFuture/EmbodiedLab#leaderboard', feed,
  terms:'Apache License 2.0. https://github.com/HexaFuture/EmbodiedLab/blob/main/LICENSE',
  parts:{Determination:'Determination', Basic:'Basic', Advanced:'Advanced', Optimization:'Optimization'},
  async fetch() {
    const section = (await fetchText(feed)).split('## Leaderboard\n')[1]?.split('## Getting started')[0];
    if (!section) throw new Error('Missing EmbodiedLab leaderboard');
    function rowsAfter(header: string) {
      const chunk = section!.split(header)[1]?.trimStart().split('\n\n')[0];
      if (!chunk?.startsWith('|:') && !chunk?.startsWith('|--')) throw new Error('Missing table: ' + header);
      return chunk.split('\n').slice(1).map(line => line.split('|').slice(1,-1).map(s => s.trim().replaceAll('**','')));
    }
    const tokens = rowsAfter('| Model | Input (M) | Output (k) |');
    const rows = rowsAfter('| Rank | Model | All (35) | Determination (30) | Basic (18) | Advanced (12) | Optimization (5) | Attainment |')
      .map(([,model,...cells]) => {
        const counts = tokens.find(row => row[0] === model);
        if (!counts || cells.length !== 6) throw new Error('Invalid native-control row for ' + model);
        const inputTokens = numberCell(counts[1]) * 1e6, outputTokens = numberCell(counts[2]) * 1e3;
        const metrics: Record<string, number> = { inputTokens, outputTokens, attainment:numberCell(cells[5]) };
        ['All','Determination','Basic','Advanced','Optimization'].forEach((key,i) => {
          const m = cells[i].match(/^([\d.]+) \(([\d.]+)\)$/);
          if (!m) throw new Error('Missing success rate or process score for ' + key);
          metrics[key] = numberCell(m[1]);
          metrics[key + ' process score'] = numberCell(m[2]);
        });
        const effort = /^(GPT|Claude)/.test(model) ? 'medium' : 'high';
        return {model, score:metrics.All, setting:'Native control (T0), ' + effort + ' reasoning effort',
          tokens:outputTokens, metrics};
      });
    return checked(rows,7);
  },
};
export default board;
