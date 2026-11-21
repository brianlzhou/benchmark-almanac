// Miðeind evaluates Icelandic case government. Its feed gives exact-match accuracy across subject and construction questions.
import type { Leaderboard } from './types.ts';
import { mideindFeed, mideindPage, mideindRows, mideindTerms } from './icelandic-wikiqa.ts';

const board: Leaderboard = {
  benchmark: 'mideind-icelandic-case-government', url: mideindPage, feed: mideindFeed, terms: mideindTerms,
  aliases: { 'Llama 3.1 70B Instruct': 'llama-3-1-70b', 'Llama 3.1 8B Instruct': 'llama-3-1-8b' },
  parts: { subject: 'Subject', construct: 'Construct' },
  fetch: () => mideindRows('icelandic_case_marking@v1', 'accuracy', { subject: 'accuracy_subject', construct: 'accuracy_construct' }),
};
export default board;
