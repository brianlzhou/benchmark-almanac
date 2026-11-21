// RedditImpacts ranks submitted span extraction systems by strict F1. Table 7 in the organizers’ workshop overview also gives relaxed F1 for each team.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2026.smm4h-1.53.pdf";

const board: Leaderboard = {
  benchmark: "reddit-impacts-2", static: 'paper',
  url: "https://www.codabench.org/competitions/13991",
  feed: FEED,
  terms: "No score reuse license verified. CodaBench serves a challenge to the API request. The organizers publish the final table through ACL Anthology.",
  stats: { relaxedF1: { name: 'Relaxed F1', unit: 'score', better: 'higher', note: 'F1 with relaxed span matching, stored from 0 to 1.' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const section = paper.split(/Team\s+Strict F1\s+Relaxed F1\s+System Summary/)[1]?.split('Table 7:')[0];
    if (!section) throw new Error('Missing RedditImpacts table');
    const rows = [...section.matchAll(/^\s*([\w!-]+)\s+(0\.\d+)\s+(0\.\d+)\s+/gm)].map(([,team,strict,relaxed]) => ({
      model: team, submitter: team, score: Number(strict), metrics: { relaxedF1: Number(relaxed) }
    }));
    if (rows.length < 10) throw new Error('Expected ten RedditImpacts teams');
    return rows;
  },
};
export default board;
