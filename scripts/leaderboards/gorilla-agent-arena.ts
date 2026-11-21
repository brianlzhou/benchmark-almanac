// Agent Arena collects preferences between agents in head-to-head battles.
// Its model leaderboard reports each model's overall skill parameter in Elo points.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://agent-arena.vercel.app/api/leaderboard/models';
type Entry = { name: string, skillParameter: number, totalVotes: number, votePercentage: string };

const board: Leaderboard = {
  benchmark: 'gorilla-agent-arena',
  url: 'https://www.agent-arena.com/leaderboard',
  feed,
  terms: 'Gorilla publishes the leaderboard client under Apache 2.0. https://github.com/ShishirPatil/gorilla/blob/main/LICENSE',
  aliases: {
    'llama-3.1-8B-instruct': 'llama-3-1-8b',
    'llama-3.1-70B-instruct': 'llama-3-1-70b',
    'llama-3.1-405B-instruct': 'llama-3-1-405b',
    'open-mixtral-8x22b': 'mixtral-8x22b',
    'open-mixtral-8x7b': 'mixtral-8x7b',
    'mistral-large-2407': 'mistral-large-2-jul-2024',
  },
  async fetch() {
    const entries = await fetchJson<Entry[]>(feed);
    const rows = entries.map(({ name, skillParameter, totalVotes, votePercentage }) => {
      if (!name || !Number.isFinite(skillParameter) || !Number.isInteger(totalVotes) ||
          typeof votePercentage !== 'string' || !/^\d+(\.\d+)?$/.test(votePercentage)) {
        throw new Error('Invalid Agent Arena model leaderboard entry');
      }
      return { model: name, score: skillParameter, metrics: { votes: totalVotes, votePercentage: Number(votePercentage) } };
    });
    return checked(rows, 20);
  },
};
export default board;
