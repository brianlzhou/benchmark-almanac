// Axis Spatial ranks geospatial models by a published weighted index. Its static tables give separate
// text-only and text-plus-vision rankings at each model's best eligible effort, plus cost per agent task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';
const feed = "https://www.axisspatial.com/arena/intelligence-index";
const board: Leaderboard = {
  benchmark: 'spatial-intelligence-index-2',
  url: "https://www.axisspatial.com/arena/intelligence-index",
  feed,
  terms: "Axis Spatial permits reuse of scores and charts with credit and a link. Its robots.txt permits the public index page. https://www.axisspatial.com/arena/methodology/data-policy",
  aliases: { 'Nemotron 3.5 Super VL 120B': 'nemotron-3-5-super-vl', 'Nemotron 3 Nano Omni 30B': 'nemotron-3-nano-omni-30b-a3b',
    'Nemotron 3.5 Lightning 30B': 'nemotron-3-5-lightning-30b-a3b', 'Muse Glimmer 30B': 'muse-glimmer' },
  async fetch() {
    const all = tables(await fetchText(feed));
    const rankings = all.filter(t => t[0][0].text === 'Rank' && t[0][3]?.text === 'Index');
    const costs = all.filter(t => t[0][2]?.text === 'Cost per agent task (USD)');
    if (rankings.length !== 3 || costs.length !== 3) throw new Error('Missing index tables');
    const rows: LeaderboardRow[] = [];
    board.parts = {};
    // The middle table repeats the open-weight subset of the first table.
    for (const i of [0, 2]) {
      const table = rankings[i], vision = i === 2;
      const parts = table[0].slice(4).map(c => c.text.replace(/ \(\d+\/\d+\)$/, ''));
      if (table.length < (vision ? 15 : 41) || vision !== parts.includes('Vision')) throw new Error('Incomplete index ranking');
      const key = (html: string) => html.match(/href="([^"]+)"/)?.[1];
      const costTable = new Map(costs[i].slice(1).map(r => [key(r[0].html), r]));
      for (const r of table.slice(1)) {
        const href = key(r[1].html), model = text(r[1].html.split('</a>')[0]).match(/^(.+) \(([^()]+)\)$/);
        const score = num(r[3].text), resource = costTable.get(href);
        if (!href || !model || score === undefined || !resource || num(resource[1].text) !== score) throw new Error('Inconsistent index entry');
        const metrics: Record<string, number> = {};
        for (const [j, part] of parts.entries()) {
          const value = num(r[j + 4].text);
          if (value === undefined) throw new Error('Missing index component');
          metrics[part] = value;
          board.parts[part] = part;
        }
        rows.push({ model: model[1], setting: (vision ? 'Text + vision' : 'Text only') + ', ' + model[2],
          open: r[1].text.includes('Open weights'), score, link: new URL(href, feed).href, metrics, cost: num(resource[2].text) });
      }
    }
    return rows;
  },
};
export default board;
