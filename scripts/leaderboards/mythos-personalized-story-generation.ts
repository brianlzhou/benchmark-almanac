// Mythos tests personalized story generation against a non-personalized Average Author baseline.
// The score is the all-source win rate for faithfulness to writing history.
// This importer reads Table 2 of the benchmark paper for GPT-4o with each personalization setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.ijcnlp-long.82.pdf';
const board: Leaderboard = {
  benchmark: 'mythos-personalized-story-generation', static: 'paper',
  url: 'https://aclanthology.org/2025.ijcnlp-long.82/', feed,
  terms: 'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: { reddit: 'Reddit', ao3: 'AO3', storium: 'Storium', newMag: 'New Yorker Magazine', newYorker: 'New Yorker', all: 'All sources' },
  async fetch(): Promise<LeaderboardRow[]> {
    const p = await pdfText(feed);
    if (!/RAG\s+40\s+52\s+42\s+21\s+40\s+39/.test(p)) throw new Error('Missing Mythos Table 2');
    const rows = [
      ['RAG',40,52,42,21,40,39], ['Delta',56,60,50,64,53,57], ['Sheet',74,76,73,85,80,78],
      ['Sheet-nP',74,80,60,85,86,78], ['Summ',84,96,87,85,80,87], ['Summ-nP',76,86,85,100,100,90],
    ];
    return checked(rows.map(([setting,reddit,ao3,storium,newMag,newYorker,all]) => ({ model:'GPT-4o', setting:String(setting), score:Number(all), metrics:{reddit:Number(reddit),ao3:Number(ao3),storium:Number(storium),newMag:Number(newMag),newYorker:Number(newYorker),all:Number(all)} })), 6);
  },
};
export default board;
