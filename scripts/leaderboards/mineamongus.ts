// The source reports no overall score. The headline is the plain mean of the two parts, computed by this importer.
// MineAmongUs tests VLM agents in two roles. Table 23 gives imposter wins for each opponent under four ARIA settings.
// Each cell represents two matches. The other side wins every match the imposters lose.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2608.30428';
const board: Leaderboard = {
  benchmark:'mineamongus', static:'paper', url, feed:url, terms:PAPER_TERMS,
  headline:'The headline is the mean of imposter and crewmate win rates against the same twelve opponents.',
  parts: {imposter:{name:'Imposter win rate',unit:'%'},crewmate:{name:'Crewmate win rate',unit:'%'}},
  aliases: {'Gemma4-26B-A4B':'gemma-4-26b-a4b'},
  async fetch() {
    const html = await paperHtml(url);
    const rows = [];
    for (const panel of html.matchAll(/<figure\b[^>]*class="[^"]*ltx_figure_panel[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)) {
      const setting = panel[1].match(/<figcaption\b[^>]*>[\s\S]*?>(Case[12][AB])<\/span>/)?.[1];
      if (!setting) continue;
      const table = flatPaperTables(panel[1]).map(grid).find(t => t[0][0].includes('Crewmate') && t[0].at(-1) === 'Imposter WR');
      if (!table || table.length !== 13 || table[0].length !== 14) throw new Error('Missing matchup matrix for ' + setting);
      const opponents = table[0].slice(1,-1);
      for (const [i,model] of opponents.entries()) {
        const own = table.find(r => r[0] === model);
        if (!own) throw new Error('Missing imposter row for ' + model);
        const imposter = own.slice(1,-1).reduce((sum,v) => sum + numberCell(v),0)/12;
        const crewmate = table.slice(1).reduce((sum,r) => sum + 100 - numberCell(r[i+1]),0)/12;
        rows.push({model, setting, harness:'ARIA', score:(imposter+crewmate)/2, metrics:{imposter,crewmate}});
      }
    }
    return checked(rows,48);
  },
};
export default board;
