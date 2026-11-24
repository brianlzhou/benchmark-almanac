// The source reports no overall score. The headline is the plain mean of the 15 parts, computed by this importer, for image inputs.
// Text inputs have 14 parts because the Water Level Test has no text presentation. Tables 1 and 2 give task accuracies and standard deviations.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2410.06468";
const board: Leaderboard = {
  benchmark: "space-apple",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2410.06468",
  parts: {}, stats: {},
  headline: 'This is the plain mean accuracy across all tasks available for the presentation, 15 for image input and 14 for text.',
  aliases: { 'Mistral 123B': 'mistral-large-2-jul-2024', 'Yi 1.5 9B': 'yi-1-5-9b-chat' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const large = tables.find(t => t[0][1] === 'Observation space: Ego image');
    const multi = tables.find(t => t[0][1] === 'Multimodal' && t[1][1] === 'MRT');
    const text = tables.find(t => t[0][1] === 'Text-only' && t[1][1] === 'MRT');
    if (!large || !multi || !text || large[1][5] !== 'Shortcut discovery') throw new Error('Missing SPACE tasks');
    let setting = '';
    const rows: LeaderboardRow[] = [];
    for (const row of large) {
      const model = row[0];
      if (!model) { setting = row[1].replace('Observation space: ', ''); continue; }
      if (['Method','Human','Chance'].includes(model)) continue;
      const small = setting === 'DM text' ? text : multi;
      const other = small.find(r => r[0] === model);
      if (!other) continue;
      const metrics: Record<string,number> = {};
      const means: number[] = [];
      for (const [header, cells] of [[large[1],row],[small[1],other]]) {
        for (let i=1; i<header.length-1; i++) {
          const value = cells[i].replace(/\\color\[rgb\]\{[^}]+\}/g, '');
          const match = value.match(/^(\d+\.\d+)~\\scriptstyle\{\\pm (\d+\.\d+)\}$/);
          if (!match) throw new Error('Unexpected SPACE measurement: ' + value);
          const key = header[i];
          board.parts![key] = key;
          board.stats![key+'Std'] = { name: key+' standard deviation', unit: '%' };
          metrics[key] = Number(match[1]); metrics[key+'Std'] = Number(match[2]);
          means.push(metrics[key]);
        }
      }
      rows.push({ model, setting, score: means.reduce((a,b) => a+b,0)/means.length, metrics });
    }
    return checked(rows, 16);
  },
};
export default board;
