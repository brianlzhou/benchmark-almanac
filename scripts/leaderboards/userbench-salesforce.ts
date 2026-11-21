// UserBench tests travel agents' ability to elicit preferences and select suitable options. The Score column measures reward.
// Tables 3 and 4 cover single-choice and multi-choice runs. Tables 7 and 8 add newer models and temperature variants.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2026.emnlp-main.772.pdf';
const board: Leaderboard = {
  benchmark: 'userbench-salesforce', url: 'https://aclanthology.org/2026.emnlp-main.772/', feed, static: 'paper',
  terms: 'ACL Anthology publishes the paper under the terms at https://aclanthology.org/2026.emnlp-main.772/.',
  aliases: { 'Claude-4-Sonnet': 'claude-sonnet-4' },
  async fetch() {
    const paper = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [table, setting] of [[3, 'Single-choice'], [4, 'Multi-choice']] as const) {
      const end = paper.indexOf('Table ' + table + ': UserBench main evaluation results');
      const start = paper.lastIndexOf('Search Attempt',end);
      const block = paper.slice(start,end);
      if (!block.includes('Correct Exist Rate') || !block.includes('(Active / Passive)')) throw new Error('UserBench main table missing');
      for (const m of block.matchAll(/^\s*(\S+)\s+(0\.\d+)\s+(0\.\d+)\s+(0\.\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+\(([\d.]+)\s*\/\s*([\d.]+)\)/gm)) {
        const [best,correct,score,validSearch,validAction,elicited,active,passive] = m.slice(2).map(Number);
        rows.push({ model: m[1], setting, score, metrics: { bestExistRate: best, correctExistRate: correct, validSearch, validAction, elicited, active, passive } });
      }
    }
    if (!paper.includes('Table 7: Additional single-choice') || !paper.includes('Table 8: Effect of sampling temperature')) throw new Error('UserBench supplementary results missing');
    for (const m of paper.matchAll(/^\s*(GPT-5\.2|Gemini-3\.1-Pro|Qwen3-(?:32|14)B, T = 0\.6)\s+(0\.\d+)\s+(0\.\d+)\s+(0\.\d+)/gm)) {
      const [model, temperature] = m[1].split(', T = ');
      rows.push({ model, setting: temperature ? 'Single-choice, temperature ' + temperature : 'Single-choice', score: Number(m[4]),
        metrics: { bestExistRate: Number(m[2]), correctExistRate: Number(m[3]) } });
    }
    return checked(rows, 26);
  },
};
export default board;
