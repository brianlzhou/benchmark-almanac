// ReactHuman tests the reactions of embodied models to sudden household hazards.
// The main table reports semantic action accuracy as a percentage, followed by four safety and physical execution measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = "https://arxiv.org/html/2609.10895";
const board: Leaderboard = {
  benchmark: "reacthuman", feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: {"safety": {"name": "Safety validity", "unit": "%"}, "endpointDistance": {"name": "Physical endpoint distance", "unit": "score", "note": "Meters.", "better": "lower"}, "actionIntentAlignment": {"name": "Action-intent alignment", "unit": "score", "note": "Ranges from 0 to 1."}, "minimumHandDistance": {"name": "Minimum hand distance", "unit": "score", "note": "Meters.", "better": "lower"}},
  headline: "The paper reports no overall score, so the headline uses its first measure, semantic action accuracy.",
  async fetch() {
    const paper = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    {
      const table = flatPaperTables(paper.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid).find(t =>
        t[0]?.join('|') === "Model|SAA \\uparrow|Safety \\uparrow|d_{end} (m) \\downarrow|AIA \\uparrow|d_{\\min} (m) \\downarrow");
      if (!table) throw Error('Missing reviewed results table');
      for (const cells of table.slice(1)) {
        const model = cells[0].trim();
        if (["Mean"].includes(model)) continue;
        function value(i: number) {
          const raw = cells[i]?.replace(/%$/, '');
          if (!raw || !/^-?\d+(?:\.\d+)?$/.test(raw)) throw Error('Invalid score for ' + model);
          return Number(raw);
        }
        const metrics = { "safety": value(2), "endpointDistance": value(3), "actionIntentAlignment": value(4), "minimumHandDistance": value(5) };
        rows.push({ model, score: value(1), metrics });
      }
    }
    return checked(rows, 7);
  },
};
export default board;
