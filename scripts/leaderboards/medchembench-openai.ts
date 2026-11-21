// MedChemBench: 99 medicinal chemistry problems built from recent papers and patents. OpenAI's paper (November 9,
// 2026) scores eleven GPT models at every reasoning effort. The headline is Table S1's mean score: each response's
// earned points over the task's full rubric budget, averaged within each task over ten responses, then equally across
// all 99 tasks, with a 95% task-bootstrap interval. Table S1 also gives mean output tokens per response. Table S2
// gives the score on four answer components, each normalized by that component's points within the tasks that have
// it. The importer reads both supplementary tables from the paper's text layer.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://cdn.openai.com/pdf/09c4ec60-a32e-4652-837b-1811368a3bb0/medchembench-paper.pdf';
// a page number from the footer can start a line, so the patterns skip one
const MODEL = String.raw`(?:\d+\s+)?(GPT-\d+(?:\.\d+)?(?:\s+(?:Luna|Terra|Sol|Astra))?)`;
const EFFORT = String.raw`(none|minimal|low|medium|high|xhigh|max)`;
const PCT = String.raw`([\d.]+)%\s*\(([\d.]+)%–([\d.]+)%\)`;

const board: Leaderboard = {
  benchmark: 'medchembench-openai',
  static: 'paper',
  url: FEED,
  feed: FEED,
  terms: 'OpenAI publishes the paper on its CDN. Tables S1 and S2 are credited to the authors (Li et al., OpenAI, 2026).',
  parts: {
    structure: 'Molecular structure (SMILES)',
    rationale: 'Scientific rationale',
    ranking: 'Ranking and candidate selection',
    numerical: 'Numerical prediction',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const s1 = text.slice(text.indexOf('Supplementary Information'), text.indexOf('Table S1:'));
    const s2 = text.slice(text.indexOf('Table S1:'), text.indexOf('Table S2:'));
    if (!s1.includes('Mean output tokens') || !s2.includes('C. Structure')) throw new Error('Tables S1 and S2 not found');
    const parts = new Map<string, Record<string, number>>();
    for (const m of s2.matchAll(new RegExp(String.raw`^\s*${MODEL}\s+${EFFORT}\s+${PCT}\s+${PCT}\s+${PCT}\s+${PCT}`, 'gm'))) {
      parts.set(`${m[1].replace(/\s+/g, ' ')}|${m[2]}`, { structure: +m[3], rationale: +m[6], ranking: +m[9], numerical: +m[12] });
    }
    const rows: LeaderboardRow[] = [];
    for (const m of s1.matchAll(new RegExp(String.raw`^\s*${MODEL}\s+${EFFORT}\s+([\d.]+)k\s+${PCT}`, 'gm'))) {
      const model = m[1].replace(/\s+/g, ' ');
      const metrics = parts.get(`${model}|${m[2]}`);
      if (!metrics) throw new Error(`No Table S2 row for ${model} at ${m[2]} effort`);
      rows.push({ model, setting: `${m[2]} effort`, score: +m[4], low: +m[5], high: +m[6], tokens: Math.round(+m[3] * 1000), trials: 10, date: '2026-11-09', metrics });
    }
    // the paper reports 61 model and effort conditions
    if (rows.length !== 61 || parts.size !== 61) throw new Error(`Expected 61 conditions, read ${rows.length} and ${parts.size}`);
    return rows;
  },
};
export default board;
