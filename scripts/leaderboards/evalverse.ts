// The source reports no overall score. The headline is the plain mean of the 18 parts, computed by this importer.
// EvalVerse compares cinematic videos. Table 3 lists the machine win ratio first and the human win ratio second.
// Use expert win ratios for the headline and preserve the machine estimates for the same dimensions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.23271v1';
const board: Leaderboard = {
  benchmark:'evalverse', static:'paper', url:feed, feed, terms:PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline:'The paper reports no overall score, so the headline averages the expert pairwise win ratios across all 18 dimensions.',
  stats: {
    'Machine Character': { name: 'Machine character win ratio', unit: 'score', better: 'higher' },
    'Machine Scene': { name: 'Machine scene win ratio', unit: 'score', better: 'higher' },
    'Machine Consistency': { name: 'Machine consistency win ratio', unit: 'score', better: 'higher' },
    'Machine Action': { name: 'Machine action win ratio', unit: 'score', better: 'higher' },
    'Machine Expression': { name: 'Machine expression win ratio', unit: 'score', better: 'higher' },
    'Machine Composition': { name: 'Machine composition win ratio', unit: 'score', better: 'higher' },
    'Machine Pacing': { name: 'Machine pacing win ratio', unit: 'score', better: 'higher' },
    'Machine Lens': { name: 'Machine lens win ratio', unit: 'score', better: 'higher' },
    'Machine Visual Quality': { name: 'Machine visual quality win ratio', unit: 'score', better: 'higher' },
    'Machine Chromaticity': { name: 'Machine chromaticity win ratio', unit: 'score', better: 'higher' },
    'Machine Lighting': { name: 'Machine lighting win ratio', unit: 'score', better: 'higher' },
    'Machine Materiality': { name: 'Machine materiality win ratio', unit: 'score', better: 'higher' },
    'Machine Grounding': { name: 'Machine grounding win ratio', unit: 'score', better: 'higher' },
    'Machine Progression': { name: 'Machine progression win ratio', unit: 'score', better: 'higher' },
    'Machine Logic': { name: 'Machine logic win ratio', unit: 'score', better: 'higher' },
    'Machine Rhythm': { name: 'Machine rhythm win ratio', unit: 'score', better: 'higher' },
    'Machine Vocal': { name: 'Machine vocal win ratio', unit: 'score', better: 'higher' },
    'Machine Soundscape': { name: 'Machine soundscape win ratio', unit: 'score', better: 'higher' },
  },
  aliases:{ 'Seedance 2.0':'dreamina-seedance-2-0','Happy Horse 1.0':'happyhorse-1-0' },
  async fetch() {
    const html = await paperHtml(feed);
    const figure = html.match(/<figure id="S7\.T3"[\s\S]*?<\/figure>/)?.[0];
    if (!figure || !figure.includes('Machine Win Ratio (left) / Human Win Ratio (right)')) throw Error('Missing Table 3 ratio definition');
    const table = grid(paperTables(figure)[0]);
    const dimensions = table.slice(1);
    if (table[0][0] !== 'Evaluation Dimensions' || dimensions.length !== 18 || new Set(dimensions.map(r=>r[1])).size !== 18) throw Error('Unexpected evaluation dimensions');
    const rows: LeaderboardRow[] = [];
    board.parts = Object.fromEntries(dimensions.map(r=>[r[1],r[1]]));
    for (const [index,model] of table[0].slice(2).entries()) {
      const metrics: Record<string,number> = {};
      let total = 0, count = 0;
      for (const row of dimensions) {
        const cell = row[index+2];
        if (cell === '-/-') continue;
        const pair = cell?.match(/^(\d+\.\d+)\/(\d+\.\d+)$/);
        if (!pair) throw Error('Invalid win ratios for ' + model);
        metrics['Machine ' + row[1]] = Number(pair[1]);
        metrics[row[1]] = Number(pair[2]);
        total += metrics[row[1]];
        count++;
      }
      if (count === dimensions.length) rows.push({ model, score:total/count, metrics });
    }
    return checked(rows,3);
  },
};
export default board;
