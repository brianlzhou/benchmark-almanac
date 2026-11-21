// PsychEthicsBench tests ethical knowledge and behavior in Australian mental health contexts.
// The headline is Global total exact match on Task I, the paper's overall multiple-choice score.
// Table 1 reports 14 named models under Aussie and Global test modes, with exact match and partial credit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2026.findings-acl.1971.pdf';
const board: Leaderboard = {
  benchmark: 'psychethicsbench', static: 'paper',
  url: 'https://aclanthology.org/2026.findings-acl.1971/', feed: FEED,
  terms: 'The ACL Anthology paper is publicly available. Source attribution and the ACL Anthology terms apply.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const start = text.indexOf('M ODEL ↓');
    const end = text.indexOf('Table 1: Performance', start);
    if (start < 0 || end < 0) throw new Error('PsychEthicsBench Table 1 missing');
    const rows: LeaderboardRow[] = [];
    const re = /\b(Qwen2\.5-7B|Llama3-8B|Llama2-13B|Qwen2\.5-14B|Crispers-7B|SQPsychLLM-8B|Mentallama-13B|EmoLlama-13B|Crispers-14B|HuatuoGPT-7B|Meditron3-7B|Med42-Llama-8B|Meditron3-14B|Baichuan-m1-14B)\s+((?:\d+\.\d+\s+){9}\d+\.\d+)/g;
    for (const m of text.slice(start, end).matchAll(re)) {
      const values = m[2].trim().split(/\s+/).map(Number);
      if (values.length !== 10) continue;
      rows.push({ model: m[1], score: values[9], setting: 'Global', metrics: { aussieSmcqEm: values[0], aussieMmcqEm: values[2], aussieTotalEm: values[4], aussieTotalPc: values[5], globalSmcqEm: values[6], globalMmcqEm: values[8], globalTotalPc: values[9] } });
    }
    if (rows.length !== 14) throw new Error(`Expected 14 PsychEthicsBench rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
