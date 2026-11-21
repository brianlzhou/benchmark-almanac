// Moltron v2 ranks models by the mean match win rate of their working bots. The versioned results panel contains the mean, confidence band and per-opponent table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables,num } from '../lib/html.ts';

const FEED = "https://ageofmoltron.com/leaderboard";

const board: Leaderboard = {
  benchmark: "moltron-llm-showdown-2",
  url: "https://ageofmoltron.com/leaderboard",
  feed: FEED,
  terms: "No score reuse license verified. The robots URL returns HTML.",
  async fetch() {
    const page = await fetchText(FEED);
    const panel = page.match(/<section class="ver-panel" data-ver="v2\.0"[^>]*>([\s\S]*?)<\/section>/)?.[1];
    if (!panel) throw new Error('Missing Moltron v2 panel');
    const table = tables(panel).find(t => t[0]?.[3]?.text.startsWith('vs '));
    if (!table || table.length < 7) throw new Error('Missing v2 opponent scores');
    const parts: Record<string,string> = {};
    const rows = table.slice(1).map(row => {
      const model = row[0].text;
      const chart = panel.split('<div class="drow">').slice(1).find(b => b.includes('<span class="mname">'+model+'</span>'))?.split('</div>\n  </div>')[0];
      const score = chart?.match(/class="meanline" style="left:([\d.]+)%/);
      const band = chart?.match(/class="ciband" style="left:([\d.]+)%;width:([\d.]+)%/);
      const count = num(row[2].text);
      if (!score || !band || count == null) throw new Error('Missing v2 chart for '+model);
      const metrics: Record<string,number> = {};
      for (const [i,cell] of row.slice(3).entries()) {
        const key = table[0][i+3].text, val = num(cell.text);
        if (val == null) throw new Error('Missing opponent win rate'); parts[key] = key; metrics[key] = val;
      }
      return { model, score: Number(score[1]), low: Number(band[1]), high: Number(band[1])+Number(band[2]), trials: count, metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
