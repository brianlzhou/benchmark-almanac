// The Te Hiku Māori golden dataset measures automatic speech recognition word error rate on curated Māori speech.
// The score is WER in percent, where lower is better.
// This importer reads the publisher's comparison in its golden-dataset article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://blog.papareo.nz/whisper-is-another-case-study-in-colonisation/';
const board: Leaderboard = {
  benchmark: 'te-hiku-maori-golden-dataset',
  url: feed,
  feed,
  terms: 'Papa Reo publishes the article and its comparison under the site terms. https://blog.papareo.nz/',
  async fetch() {
    const source = await fetchText(feed);
    if (!/53% WER on the golden dataset/.test(source) || !/73% WER/.test(source) || !/38% WER on our golden dataset/.test(source)) throw new Error('Missing Te Hiku golden-dataset WER comparison');
    const rows: LeaderboardRow[] = [
      { model: 'Te Hiku current ASR (Mozilla DeepSpeech)', score: 53 },
      { model: 'Whisper large, Māori language mode', score: 73 },
      { model: 'Whisper large, Te Hiku fine-tuned', score: 38 },
    ];
    return rows;
  },
};
export default board;
