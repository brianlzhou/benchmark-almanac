// ROOMELSA teams rank ten retrieved 3D objects. The organizers' paper reproduces the final mean reciprocal rank and recall table from the competition page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2508.08781v1";

const board: Leaderboard = {
  benchmark: "roomelsa-shrec-2025", static: 'paper',
  url: "https://aichallenge.hcmus.edu.vn/shrec-2025/smart3droom#h.a8wvullqsccv_l",
  feed,
  terms: "The organizers claim copyright on the results page. The paper permits academic access to the dataset. https://aichallenge.hcmus.edu.vn/shrec-2025/smart3droom The competition host returns 404 for robots.txt.",
  stats: {
    recallAt1: { name: 'Recall at 1', unit: 'score', better: 'higher', note: 'Fraction of queries whose correct object is ranked first, stored from 0 to 1.' },
    recallAt5: { name: 'Recall at 5', unit: 'score', better: 'higher', note: 'Fraction of queries whose correct object is ranked in the top 5, stored from 0 to 1.' },
    recallAt10: { name: 'Recall at 10', unit: 'score', better: 'higher', note: 'Fraction of queries whose correct object is ranked in the top 10, stored from 0 to 1.' },
  },
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Team|R@1|R@5|R@10|MRR');
    if (!t || t.length < 6) throw new Error('Missing ROOMELSA finalists');
    return t.slice(1).map(c => {
      const [r1,r5,r10,score] = c.slice(1).map(v => num(v.text));
      if (score === undefined || r1 === undefined || r5 === undefined || r10 === undefined) throw new Error('Invalid retrieval scores');
      return { model: c[0].text, submitter: c[0].text, score, metrics: { recallAt1:r1, recallAt5:r5, recallAt10:r10 } };
    });
  },
};

export default board;
