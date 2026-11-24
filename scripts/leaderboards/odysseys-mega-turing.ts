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
  parts: {
    'Arts & Entertainment': { name: 'Arts & Entertainment', group: 'Subdomain' },
    'Business and Consumer Services': { name: 'Business and Consumer Services', group: 'Subdomain' },
    'Community and Society': { name: 'Community and Society', group: 'Subdomain' },
    'Computers Electronics and Technology': { name: 'Computers Electronics and Technology', group: 'Subdomain' },
    'Ecommerce & Shopping': { name: 'Ecommerce & Shopping', group: 'Subdomain' },
    Finance: { name: 'Finance', group: 'Subdomain' },
    'Food and Drink': { name: 'Food and Drink', group: 'Subdomain' },
    Games: { name: 'Games', group: 'Subdomain' },
    Health: { name: 'Health', group: 'Subdomain' },
    'Heavy Industry and Engineering': { name: 'Heavy Industry and Engineering', group: 'Subdomain' },
    'Hobbies and Leisure': { name: 'Hobbies and Leisure', group: 'Subdomain' },
    'Home and Garden': { name: 'Home and Garden', group: 'Subdomain' },
    'Jobs and Career': { name: 'Jobs and Career', group: 'Subdomain' },
    'Law and Government': { name: 'Law and Government', group: 'Subdomain' },
    Lifestyle: { name: 'Lifestyle', group: 'Subdomain' },
    'News & Media Publishers': { name: 'News & Media Publishers', group: 'Subdomain' },
    'Reference Materials': { name: 'Reference Materials', group: 'Subdomain' },
    'Science and Education': { name: 'Science and Education', group: 'Subdomain' },
    Sports: { name: 'Sports', group: 'Subdomain' },
    'Travel and Tourism': { name: 'Travel and Tourism', group: 'Subdomain' },
    Vehicles: { name: 'Vehicles', group: 'Subdomain' },
  },
  stats: {
    rubricScore: { name: 'Rubric score', unit: '%', better: 'higher' },
    steps: { name: 'Average steps', unit: 'count' },
  },
  async fetch() {
    const html = await fetchText(FEED);
    let subdomainCount = 0;
    const rows = [...html.matchAll(/<li data-model="([^"]+)" data-board-rank="\d+" data-sort-score="([\d.]+)" data-sort-reward="([\d.]+)" data-sort-steps="([\d.]+)"[^>]*>([\s\S]*?)<\/details>/g)].map(([,model,rate,reward,steps,card]) => {
      const trials = text(card).match(/\b(\d+) runs\b/);
      if (!trials) throw new Error('Missing run count for ' + model);
      const metrics: Record<string,number> = { rubricScore: Number(reward)*100, steps: Number(steps) };
      for (const [,label,value] of card.matchAll(/<b>([^<]+)<\/b><span>([\d.]+)% of \d+ runs? passed/g)) {
        const key = text(label); metrics[key] = Number(value); subdomainCount++;
      }
      return { model, score: Number(rate)*100, trials: Number(trials[1]), metrics };
    });
    if (rows.length < 4 || !subdomainCount) throw new Error('Incomplete Odysseys rankings');
    return rows;
  },
};
export default board;
