// RefusalBench averages five runs, rewarding answers except in three categories that reward refusal.
// Figure 4 and Tables 3 and 4 of the Hermes 4 report give the percentage scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/pdf/2508.18255';
const board: Leaderboard = {
  benchmark: 'refusalbench-nous', static: 'paper', url: 'https://arxiv.org/abs/2508.18255', feed,
  terms: PAPER_TERMS.replace('HTML', 'PDF'),
  aliases: { 'Deepseek R1 671B': 'deepseek-r1-may-2025', 'Qwen3 235B': 'qwen3-235b-a22b' },
  async fetch() {
    const text = await pdfText(feed);
    const chart = text.split('Figure 4: RefusalBench scores')[1]?.split('Despite its name')[0];
    if (!chart) throw new Error('Missing RefusalBench figure');
    const rows: LeaderboardRow[] = [];
    const add = (model: string, score: string, setting?: string) => {
      if (!/^\d+(?:\.\d+)?$/.test(score)) throw new Error('Invalid RefusalBench score');
      rows.push({ model, score: Number(score), setting, trials: 5 });
    };
    for (const line of chart.split('\n')) {
      const m = line.trim().match(/^(.+?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(.+?)\s{2,}(\d+(?:\.\d+)?)$/);
      if (!m) continue;
      for (const i of [1,3]) {
        const hermes = m[i].match(/^Hermes 4 \(([^)]+)\)$/);
        add(hermes ? 'Hermes 4 405B' : m[i], m[i+1], hermes?.[1]);
      }
    }
    if (rows.length !== 14) throw new Error('Incomplete RefusalBench figure');
    const extra = [...text.matchAll(/^\s*RefusalBench\s+([\d.() \t]+)$/gm)].map(m => m[1].trim().split(/\s{2,}/));
    const groups = [['Hermes 4 405B','Cogito 405B','Deepseek R1 671B','Deepseek V3','Qwen3 235B'],['Hermes 4 70B','Cogito 70B','Hermes 4 14B','Qwen3 14B']];
    if (extra.length !== 2) throw new Error('Missing RefusalBench model tables');
    groups.forEach((names, i) => {
      const cells = [...extra[i].join('  ').matchAll(/(\d+(?:\.\d+)?)(?:\s+\(([\d.]+)\))?/g)];
      if (cells.length !== names.length) throw new Error('Changed RefusalBench table');
      names.forEach((name,j) => {
        if (i === 0 && (j === 0 || j === 3)) return;
        add(name, cells[j][1], 'Reasoning');
        if (cells[j][2]) add(name, cells[j][2], 'Non-reasoning');
      });
    });
    return rows;
  },
};
export default board;
