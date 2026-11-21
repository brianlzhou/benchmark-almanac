// ALIVE-Bench evaluates social perception, understanding, influence, and outcomes.
// The Shopping and Leaderless Group Discussion tables mix percentages and rating scales.
// The headline is recognition of bodily actions in Shopping, the first reported measure.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2611.20956';
const dimensions = ['Kinesic','Proxemic','Affect','Intent','Rapport','Persuasion','Attainment','Depth'];
const board: Leaderboard = {
  benchmark:'alive-bench', static:'paper', url:feed, feed, parts:{},
  terms:'The authors publish Tables 4 and 5 on arXiv. https://arxiv.org/abs/2611.20956',
  headline:'The paper reports no combined score. The headline is Shopping kinesic cue recognition accuracy, its first measure.',
  stats: {
    shoppingKinesic:{name:'Shopping kinesic cue recognition',unit:'%',better:'higher'}, shoppingProxemic:{name:'Shopping proxemic cue recognition',unit:'%',better:'higher'}, shoppingAffect:{name:'Shopping affect recognition',unit:'%',better:'higher'}, shoppingIntent:{name:'Shopping intent recognition',unit:'%',better:'higher'}, shoppingRapport:{name:'Shopping rapport rating',unit:'score',better:'higher'}, shoppingPersuasion:{name:'Shopping persuasion rating',unit:'score',better:'higher'}, shoppingAttainment:{name:'Shopping attainment',unit:'%',better:'higher'}, shoppingDepth:{name:'Shopping depth rating',unit:'score',better:'higher'},
    lgdKinesic:{name:'Leaderless discussion kinesic recognition',unit:'%',better:'higher'}, lgdProxemic:{name:'Leaderless discussion proxemic recognition',unit:'%',better:'higher'}, lgdAffect:{name:'Leaderless discussion affect recognition',unit:'%',better:'higher'}, lgdIntent:{name:'Leaderless discussion intent recognition',unit:'%',better:'higher'}, lgdRapport:{name:'Leaderless discussion rapport rating',unit:'score',better:'higher'}, lgdPersuasion:{name:'Leaderless discussion persuasion rating',unit:'score',better:'higher'}, lgdAttainment:{name:'Leaderless discussion attainment',unit:'%',better:'higher'}, lgdDepth:{name:'Leaderless discussion depth rating',unit:'score',better:'higher'},
  },
  async fetch() {
    const html = await paperHtml(feed);
    const rows = new Map<string, LeaderboardRow>();
    for (const [key,group] of [['shopping','Shopping'],['lgd','Leaderless Group Discussion']]) {
      const figure = [...html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)].find(m => m[1].includes('Evaluation results on the') && m[1].split('</figcaption>')[0].includes(group));
      const table = figure && paperTables(figure[1]).map(grid)[0];
      if (!table || !dimensions.every((d,i) => table[1][i+1]?.startsWith(d))) throw new Error('Missing ALIVE-Bench columns: '+group);
      for (const [model,...cells] of table.slice(2)) {
        const row: LeaderboardRow = rows.get(model) ?? {model,score:NaN,metrics:{}};
        dimensions.forEach((d,i) => {
          const percent = cells[i].endsWith('%');
          const value = numberCell(cells[i].replace('%',''));
          board.parts![key+d] = {name:d,group,unit:percent ? '%' : 'score'};
          row.metrics![key+d] = value;
          if (key === 'shopping' && i === 0) row.score = value;
        });
        rows.set(model,row);
      }
    }
    return checked([...rows.values()],12);
  },
};
export default board;
