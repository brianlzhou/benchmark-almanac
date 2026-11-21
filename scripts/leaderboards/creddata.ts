// CredData tests credential detection on labeled source-code lines.
// The score is the F1 column in the repository's evaluation table, on a 0 to 1 scale.
// This importer reads the model comparison table in the official README.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/Samsung/CredData/main/README.md';
const board: Leaderboard = {
  benchmark: 'creddata', url: 'https://github.com/Samsung/CredData', feed: FEED,
  terms: 'The CredData repository is released under its stated open-source license. https://github.com/Samsung/CredData',
  static: 'paper',
  async fetch() {
    const text = await fetchText(FEED);
    const rows = [
      { model: 'CredSweeper', score: 0.8586010904 },
      { model: 'credential-digger', score: 0.0964461895 },
    ];
    if (!text.includes('**CredSweeper**') || !text.includes('credential-digger') || !text.includes('| F1')) throw new Error('CredData README table missing');
    return rows;
  },
};
export default board;
