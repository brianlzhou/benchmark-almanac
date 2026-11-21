// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// Table 2 gives success rate and progress completeness for two agents collaborating on cooking tasks at each complexity level.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.emnlp-main.249.pdf';
const parts: Record<string,BoardPart> = {};
const board: Leaderboard = {
  benchmark:'collab-overcooked', url:'https://aclanthology.org/2025.emnlp-main.249/', feed, static:'paper', parts,
  terms:'ACL Anthology distributes the authors’ paper under its publication terms. https://aclanthology.org/faq/copyright/',
  headline:'The paper gives no overall score, so this is the plain mean of success rates at its six complexity levels.',
  aliases:{ 'GPT-3.5-turbo (snapshot unspecified)': 'gpt-3-5-turbo-jan-2024' },
  async fetch() {
    const pdf = await pdfText(feed);
    const end = pdf.indexOf('Table 2: Performance of 13 representative LLMs');
    const page = pdf.slice(pdf.lastIndexOf('\f',end),end);
    if (end < 0 || !page.includes('Level 6') || !/SR\s+PC/.test(page)) throw new Error('Missing Table 2');
    const rows: LeaderboardRow[] = [];
    for (const line of page.split('\n')) {
      const m = /^\s*(\S.*?)\s+((?:\d+\.\d+\s+){11}\d+\.\d+)\s*$/.exec(line);
      if (!m) continue;
      const values = m[2].split(/\s+/).map(Number);
      const metrics: Record<string,number> = {};
      let sum = 0;
      for (let i=0; i<6; i++) {
        const key = 'level' + (i+1);
        parts[key] = {name:'Level ' + (i+1), group:'Success rate'};
        parts[key+'Progress'] = {name:'Level ' + (i+1) + ' progress completeness', group:'Progress completeness'};
        sum += metrics[key] = values[i*2];
        metrics[key+'Progress'] = values[i*2+1];
      }
      rows.push({model:m[1].trim(), score:sum/6, trials:10, metrics});
    }
    return checked(rows,13);
  },
};
export default board;
