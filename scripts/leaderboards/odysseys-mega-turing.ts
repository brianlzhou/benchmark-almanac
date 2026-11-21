// Odysseys Mega ranks browser agents by the fraction of tasks satisfying every rubric. Its published model cards contain pass rates, rubric scores, steps and subdomain results.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://bench.turing.com/odysseys-mega/leaderboard/";

const board: Leaderboard = {
  benchmark: "odysseys-mega-turing",
  url: "https://bench.turing.com/odysseys-mega/leaderboard/",
  feed: FEED,
  terms: "The publisher gives no reuse license on the benchmark page. https://bench.turing.com/odysseys-mega/leaderboard/ The robots URL returns HTML.",
  async fetch() {
    const html = await fetchText(FEED);
    const parts: Record<string,string> = {};
    const rows = [...html.matchAll(/<li data-model="([^"]+)" data-board-rank="\d+" data-sort-score="([\d.]+)" data-sort-reward="([\d.]+)" data-sort-steps="([\d.]+)"[^>]*>([\s\S]*?)<\/details>/g)].map(([,model,rate,reward,steps,card]) => {
      const trials = text(card).match(/\b(\d+) runs\b/);
      if (!trials) throw new Error('Missing run count for ' + model);
      const metrics: Record<string,number> = { rubricScore: Number(reward)*100, steps: Number(steps) };
      for (const [,label,value] of card.matchAll(/<b>([^<]+)<\/b><span>([\d.]+)% of \d+ runs? passed/g)) {
        const key = text(label); parts[key] = key; metrics[key] = Number(value);
      }
      return { model, score: Number(rate)*100, trials: Number(trials[1]), metrics };
    });
    if (rows.length < 4 || !Object.keys(parts).length) throw new Error('Incomplete Odysseys rankings');
    board.parts = parts;
    return rows;
  },
};
export default board;
