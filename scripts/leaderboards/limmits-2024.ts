// LIMMITS compares voice cloning systems by naturalness and speaker similarity under three training conditions.
// Read the six embedded Google Drawings as text-bearing PDFs. The headline is the mean naturalness rating.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://sites.google.com/view/limmits24/results";
const board: Leaderboard = {
  benchmark: "limmits-2024",
  url: "https://sites.google.com/view/limmits24/results",
  feed: FEED,
  terms: "Nine entries appear in the Track 1 naturalness table. Tracks 2 and 3 each have seven. The site identifies no score reuse license. https://sites.google.com/view/limmits24/results The Google Sites page publicly embeds the score drawings.",
  async fetch() {
    const page = await fetchText(FEED);
    const links = [...page.matchAll(/<iframe[^>]*src="(https:\/\/docs\.google\.com\/drawings\/d\/[\w-]+)\/preview/g)].map(m => m[1] + '/export/pdf');
    if (links.length !== 6) throw new Error('Expected six LIMMITS result tables');
    const scores: { model: string; avg: number; sd: number }[][] = [];
    for (const [i, link] of links.entries()) {
      if (i) await new Promise(resolve => setTimeout(resolve, 1000));
      const table = await pdfText(link);
      if (!table.includes('Team name') || !table.includes(i % 2 ? 'Score' : 'MOS')) throw new Error('Unexpected LIMMITS result table');
      const rows = [...table.matchAll(/^(\S+) +([\d.]+) +([\d.]+) *$/gm)].map(m => ({ model: m[1], avg: Number(m[2]), sd: Number(m[3]) }));
      if (rows.length < (i < 2 ? 9 : 7)) throw new Error('Missing LIMMITS teams');
      scores.push(rows);
    }
    const settings = ['Track 1: Few-shot, challenge data', 'Track 2: Few-shot, external data allowed', 'Track 3: Zero-shot, external data allowed'];
    return settings.flatMap((setting, i) => scores[i * 2].map(r => {
      const other = scores[i * 2 + 1].find(s => s.model === r.model);
      if (!other) throw new Error('Missing speaker similarity for ' + r.model);
      return { model: r.model, submitter: r.model, setting, score: r.avg, link: links[i * 2], metrics: { naturalnessSD: r.sd, similarity: other.avg, similaritySD: other.sd } };
    }));
  },
};
export default board;
