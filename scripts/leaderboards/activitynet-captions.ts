// ActivityNet Captions tests whether models can describe events in videos. Table 1
// compares three named captioning models under ground-truth event proposals. BLEU-1
// is its first column. The paper also reports BLEU-2 through BLEU-4, METEOR, and CIDEr.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://openaccess.thecvf.com/content_ICCV_2017/papers/Krishna_Dense-Captioning_Events_in_ICCV_2017_paper.pdf';
const board: Leaderboard = {
  benchmark: 'activitynet-captions', static: 'paper', url: 'https://cs.stanford.edu/people/ranjaykrishna/densevid/', feed,
  terms: 'CVF provides the author manuscript for open access. https://openaccess.thecvf.com/ICCV2017',
  headline: 'The headline is BLEU-1 with ground-truth event proposals, the first column in Table 1.',
  async fetch() {
    const section = (await pdfText(feed)).split('with GT proposals')[1]?.split('Table 1:')[0];
    if (!section?.includes('with learnt proposals') || !/B@1\s+B@2\s+B@3\s+B@4\s+M\s+C/.test(section)) throw new Error('Missing caption scores');
    const rows: LeaderboardRow[] = [];
    for (const match of section.matchAll(/^\s*([^\n]+?) \[\d+\]\s+((?:\d+\.\d+\s+){6})-/gm)) {
      const [score, bleu2, bleu3, bleu4, meteor, cider] = match[2].trim().split(/\s+/).map(Number);
      rows.push({model: match[1].trim(), setting: 'Ground-truth event proposals', score, metrics: {bleu2, bleu3, bleu4, meteor, cider}});
    }
    return checked(rows,3);
  },
};
export default board;
