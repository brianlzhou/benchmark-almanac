// FPL ranks final-round teams by their mean rank across seven FPGA designs, with ties ranked as on the page.
// Read the seven final tables and check their mean against the prize table's published values.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://xilinx.github.io/fpl26_optimization_contest/results.html";
const feed = url;

const board: Leaderboard = {
  benchmark: 'fpl-2026-agentic-fpga-backend-optimization', url, feed,
  terms: "Xilinx publishes the contest results on GitHub Pages. The site provides no applicable robots rules or separate score license.",
  parts: {},
  async fetch() {
    const page = (await fetchText(feed)).split('<h2 id="beta-submission-results')[0];
    const prize = tables(page).find(t => t[0]?.[2]?.text === 'Mean rank');
    if (!prize || prize.length < 6) throw new Error('Missing prize rankings');
    const links = new Map<string, string>();
    for (const m of page.matchAll(/<h3 [^>]*>\d+\w+ Place: ([^<]+)<\/h3>([\s\S]*?)Open-source repository:<\/strong> <a href="([^"]+)"/g)) links.set(m[1], m[3]);
    const entrants = new Map<string, {ranks: number[], metrics: Record<string, number>}>();
    const designs = [...page.matchAll(/<h4 id="([^"]+)">([^<]+)<\/h4>\s*(<table[\s\S]*?<\/table>)/g)];
    if (designs.length !== 7) throw new Error('Expected seven final designs');
    for (const [,key,name,html] of designs) {
      board.parts![key] = { name, better: 'lower', note: 'Final rank on this design.' };
      const [header, ...rows] = tables(html)[0];
      if (header.map(c => c.text).join('|') !== 'Rank|Team|Score' || rows.length < 24) throw new Error('Incomplete final design: ' + name);
      for (const [rank, team, score] of rows) {
        if (!team.text || !/^\d+$/.test(rank.text) || !/^-?\d+(\.\d+)?$/.test(score.text)) throw new Error('Invalid result for ' + name);
        const result = entrants.get(team.text) ?? { ranks: [], metrics: {} };
        if (key in result.metrics) throw new Error('Duplicate team in ' + name);
        result.ranks.push(Number(rank.text));
        result.metrics[key] = Number(rank.text);
        result.metrics[key + 'Score'] = Number(score.text);
        entrants.set(team.text, result);
      }
    }
    return [...entrants].map(([team, {ranks, metrics}]) => {
      if (ranks.length !== 7) throw new Error('Missing design for ' + team);
      const score = Number((ranks.reduce((a,b) => a+b, 0) / ranks.length).toFixed(3));
      const award = prize.slice(1).find(c => c[1].text === team);
      if (award && Number(award[2].text) !== score) throw new Error('Mean rank disagrees for ' + team);
      return { model: team, submitter: team, score, metrics, link: links.get(team) };
    });
  },
};
export default board;
