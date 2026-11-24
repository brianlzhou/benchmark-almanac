// CAISI measures the percentage of 577 capture-the-flag tasks each model solves.
// Table 4.1 gives accuracy and standard error. Table 5.3 adds GPT-5-mini.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.nist.gov/system/files/documents/2025/09/30/CAISI_Evaluation_of_DeepSeek_AI_Models.pdf';
const board: Leaderboard = {
  benchmark: 'ctf-archive', static: 'paper', url: feed, feed,
  terms: 'CAISI publishes the report under NIST terms at https://www.nist.gov/disclaimer.',
  stats: { stderr: { name: 'Standard error', unit: '%' } },
  aliases: { 'Opus 4': 'claude-opus-4', 'gpt-oss': 'gpt-oss-120b', 'V3.1': 'deepseek-v3-1', 'R1-0528': 'deepseek-r1-may-2025', R1: 'deepseek-r1' },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/(GPT-5\s+Opus 4\s+gpt-oss\s+V3\.1\s+R1-0528\s+R1)\s+CVE-Bench[^\n]*\n\s*Cybench[^\n]*\n\s*CTF-Archive([^\n]*±[^\n]*)\s+Table 4\.1/);
    if (!table) throw new Error('Missing CTF-Archive accuracy and standard error in Table 4.1');
    const models = table[1].split(/\s{2,}/);
    const values = [...table[2].matchAll(/([\d.]+) ± ([\d.]+)/g)];
    if (values.length !== 6 || models.length !== 6) throw new Error('Expected six model columns');
    const rows: LeaderboardRow[] = models.map((model, i) => ({
      model, score: Number(values[i][1]), metrics: { stderr: Number(values[i][2]) },
    }));
    const mini = paper.match(/V3\.1\s+GPT-5-mini\s+CVE-Bench[^\n]*\n[^\n]*Cybench[^\n]*\n\s*CTF-Archive\s+[\d.]+\s+([\d.]+)\s+[\d.]+/);
    if (!mini) throw new Error('Missing GPT-5-mini in Table 5.3');
    rows.push({ model: 'GPT-5-mini', score: Number(mini[1]) });
    return checked(rows, 7);
  },
};
export default board;
