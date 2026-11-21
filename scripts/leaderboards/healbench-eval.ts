// HealBench-Eval scores images generated for psychological comfort.
// Table 4 reports the overall score and evaluations across six comfort categories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2610.27516";
const header = ["Model", "Overall", "Text-Image Alignment", "Heal Accuracy", "Image Quality", "Natural Restoration", "Atmospheric Immersion", "Shelter and Safety", "Living Companionship", "Rhythmic Focus", "Awe and Transcendence"];
const columns: Record<string, number> = {"Text-Image Alignment": 2, "Heal Accuracy": 3, "Image Quality": 4, "Natural Restoration": 5, "Atmospheric Immersion": 6, "Shelter and Safety": 7, "Living Companionship": 8, "Rhythmic Focus": 9, "Awe and Transcendence": 10};
const board: Leaderboard = {
  benchmark: "healbench-eval", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2610.27516." ,
  aliases: { 'SD 3.5 Large': 'stable-diffusion-3-5-large' },
  parts: {"Text-Image Alignment": "Text-Image Alignment", "Heal Accuracy": "Heal Accuracy", "Image Quality": "Image Quality", "Natural Restoration": "Natural Restoration", "Atmospheric Immersion": "Atmospheric Immersion", "Shelter and Safety": "Shelter and Safety", "Living Companionship": "Living Companionship", "Rhythmic Focus": "Rhythmic Focus", "Awe and Transcendence": "Awe and Transcendence"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      if (row.every(value => value === row[0]) || row[0] === 'Real Images') continue;
      const model = row[0].replace(/ \((?:Original|Rewrite)\)$/, '');
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i].split(' ')[0])]));
      const score = numberCell(row[1].split(' ')[0]);
      rows.push({ model, score, metrics, setting: row[0].endsWith('(Rewrite)') ? 'Rewritten prompt' : 'Original prompt' });
    }
    return checked(rows, 22);
  },
};
export default board;
