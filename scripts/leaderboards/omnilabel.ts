// OmniLabel ranks object detection submissions by average precision on the test set. Its three CodaLab tracks differ in permitted training data.
// Entries use the team name where given and the submitting account otherwise. Scores are percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://codalab.lisn.upsaclay.fr/competitions/11868/results/19114";

const tracks = [
  {name:'Track A', url: FEED, min:16},
  {name:'Track B', url:'https://codalab.lisn.upsaclay.fr/competitions/11870/results/19118', min:7},
  {name:'Track C', url:'https://codalab.lisn.upsaclay.fr/competitions/11871/results/19120', min:8},
];
const parts = ['AP_categ','AP_descr','AP_descr_pos','AP_descr_S','AP_descr_M','AP_descr_L'];

const board: Leaderboard = {
  benchmark: "omnilabel",
  url: "https://www.omnilabel.org/challenge/open-leaderboard",
  feed: FEED,
  terms: "The organizers link three evaluation tracks without specifying reuse rights for the scores. https://www.omnilabel.org/challenge/open-leaderboard",
  parts: Object.fromEntries(parts.map(k => [k,k])),
  harnesses: 'system',
  async fetch() {
    const results: LeaderboardRow[] = [];
    for (const [i,track] of tracks.entries()) {
      if (i) await new Promise(r => setTimeout(r,1000));
      const grid = tables(await fetchText(track.url)).find(t => t[1]?.some(c => c.text === 'Team Name'));
      if (!grid || grid[1].slice(5).map(c=>c.text).join('|') !== ['AP',...parts].join('|')) throw new Error('Invalid OmniLabel columns');
      const runs = grid.slice(2).filter(c => c.length);
      if (runs.length < track.min) throw new Error('Incomplete OmniLabel '+track.name);
      for (const cells of runs) {
        const submitter = cells[1].text, model = cells[4].text || submitter;
        const scores = cells.slice(5).map(c => parseFloat(c.text)*100);
        const date = cells[3].text.match(/^(\d\d)\/(\d\d)\/(\d\d)$/);
        if (!model || !date || scores.length !== 7 || !scores.every(Number.isFinite)) throw new Error('Invalid OmniLabel submission');
        results.push({model, harness: model, setting: track.name, submitter, score: scores[0], date: '20'+date[3]+'-'+date[1]+'-'+date[2], metrics: {entries:Number(cells[2].text),...Object.fromEntries(parts.map((k,j) => [k,scores[j+1]]))}});
      }
    }
    return results;
  },
};
export default board;
