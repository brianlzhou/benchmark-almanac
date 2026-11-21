// Climate-Change-NER measures extraction of named entities from scientific abstracts.
// Volkanovska's Table 3 gives token- and string-based F1 for all 555 entities in 177 test sentences.
// The table is an image. Two readings of the six full-test rows agreed. The PDF's SHA-256 guards the transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2025.nlp4ecology-1.7.pdf';
const models = ['gpt-4o-mini','gpt-4o-2024-05-13','Meta-Llama-3.1-70B-Instruct','Meta-Llama-3.1-405B-Instruct'];
const results = [
  ['3 random examples', [0.32,0.28,0.38,0.29,0.35,0.36,0.42,0.39]],
  ['4 random examples', [0.33,0.29,0.41,0.30,0.37,0.37,0.40,0.41]],
  ['5 random examples', [0.36,0.32,0.44,0.32,0.36,0.39,0.39,0.42]],
  ['3 similar examples',[0.33,0.33,0.38,0.38,0.36,0.40,0.38,0.43]],
  ['4 similar examples',[0.36,0.32,0.40,0.41,0.28,0.40,0.42,0.43]],
  ['5 similar examples',[0.36,0.38,0.42,0.43,0.30,0.40,0.39,0.44]],
] as const;
const board: Leaderboard = {
  benchmark: 'climate-change-ner', static: 'paper', url: 'https://aclanthology.org/2025.nlp4ecology-1.7/', feed,
  terms: 'ACL Anthology provides the published paper under its terms at https://aclanthology.org/faq/copyright/.',
  aliases: { 'Meta-Llama-3.1-70B-Instruct': 'llama-3-1-70b', 'Meta-Llama-3.1-405B-Instruct': 'llama-3-1-405b',
    'gpt-4o-mini (snapshot unspecified)': 'gpt-4o-mini' },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [prompt, scores] of results) {
      models.forEach((model,i) => {
        rows.push({model, setting: prompt + ', tokens', score: scores[2*i]},
          {model, setting: prompt + ', strings', score: scores[2*i+1]});
      });
    }
    return checked(await chartRows(feed, '8a9e289c00897d857c5d8e6ac40763cb12ae21aa2426b91f1b521d94a0852c1d', rows), 48);
  },
};
export default board;
