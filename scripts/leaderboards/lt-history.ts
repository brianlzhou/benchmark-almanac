// LT-History tests multilingual models on Lithuanian and general history questions.
// The paper reports accuracy for Nordic, Baltic, and multilingual language groups.
// This importer uses the multilingual group's merged accuracy from Table 1 as the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.nbreal-1.1.pdf';
const board: Leaderboard = {
  benchmark: 'lt-history', static: 'paper', url: 'https://aclanthology.org/2025.nbreal-1.1/', feed,
  terms: 'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: { nrdLT: 'NRD LT', nrdG: 'NRD G', nrdMerged: 'NRD LT+G', bltLT: 'BLT LT', bltG: 'BLT G', bltMerged: 'BLT LT+G', mltLT: 'MLT LT', mltG: 'MLT G', mltMerged: 'MLT LT+G' },
  async fetch(): Promise<LeaderboardRow[]> {
    const p = await pdfText(feed);
    if (!/GPT-4o\s+0\.87\s+0\.89\s+0\.88\s+0\.88\s+0\.89\s+0\.89/.test(p)) throw new Error('Missing LT-History Table 1');
    const rows = [
      ['GPT-4o',.87,.89,.88,.88,.89,.89,.84,.88,.86], ['QWEN2.5 72b',.74,.87,.81,.71,.83,.77,.76,.87,.82],
      ['LLaMa3.1 70b',.72,.82,.77,.72,.81,.76,.72,.81,.77], ['Mistral Nemo 12b',.36,.49,.43,.36,.42,.39,.41,.55,.48],
      ['LLaMa3.1 8b',.47,.62,.54,.44,.57,.50,.50,.66,.58], ['LLaMa3 8b',.45,.48,.46,.39,.40,.40,.48,.53,.50],
      ['QWEN2.5 7b',.49,.62,.56,.46,.48,.47,.58,.73,.65], ['LLaMa3.2 3b',.40,.50,.45,.34,.33,.34,.42,.47,.45],
    ];
    return checked(rows.map(r => ({ model: String(r[0]), score: Number(r[9]) * 100, metrics: { nrdLT:Number(r[1])*100,nrdG:Number(r[2])*100,nrdMerged:Number(r[3])*100,bltLT:Number(r[4])*100,bltG:Number(r[5])*100,bltMerged:Number(r[6])*100,mltLT:Number(r[7])*100,mltG:Number(r[8])*100,mltMerged:Number(r[9])*100 } })), 8);
  },
};
export default board;
