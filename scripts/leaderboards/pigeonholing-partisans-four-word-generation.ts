// Models generate four words about each party from a survey respondent's perspective.
// Study 2's replication CSV reports the percentage of lists whose writer's party the coder identified correctly.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'AlexMLyman/Replication-Materials-for-Balancing-Large-Language-Model-Alignment-and-Algorithmic-Fidelity';
const feed = 'https://raw.githubusercontent.com/' + repo + '/HEAD/Pigeonholing%20Partisans%20Replication/pigeonholing_results.csv';
const keys = ['positive', 'extreme', 'personality', 'policy', 'social_groups', 'delta', 'ttr', 'missing_some', 'missing_all'];
export default {
  benchmark: 'pigeonholing-partisans-four-word-generation', url: 'https://github.com/' + repo, feed,
  terms: 'The replication materials use the MIT License. https://github.com/' + repo + '/blob/main/LICENSE',
  stats: {
    positive: { name: 'Positive responses', unit: '%', better: 'higher' },
    extreme: { name: 'Extreme responses', unit: '%', better: 'higher' },
    personality: { name: 'Personality responses', unit: '%', better: 'higher' },
    policy: { name: 'Policy responses', unit: '%', better: 'higher' },
    social_groups: { name: 'Social group responses', unit: '%', better: 'higher' },
    delta: { name: 'Average absolute difference from human data', unit: '%', better: 'lower', note: 'Absolute difference from human data averaged across all categories.' },
    ttr: { name: 'Type-token ratio', unit: 'score', better: 'higher', note: 'A measure of lexical diversity.' },
    missing_some: { name: 'Responses missing some words', unit: 'count', better: 'lower', note: 'Responses missing at least one of the four words.' },
    missing_all: { name: 'Responses missing all words', unit: 'count', better: 'lower', note: 'Responses missing all four words.' },
  },
  aliases: { 'mixtral_base': 'mixtral-8x7b', 'llama-3-8b_base': 'llama-3-8b', 'llama-3-70b_base': 'llama-3-70b',
    'gemma-2-27b_base': 'gemma-2-27b', 'gemma-2-9b_base': 'gemma-2-9b' },
  async fetch() {
    const data = parseCsv(await fetchText(feed));
    return checked(data.filter(row => row.model_name !== 'human').map(row => {
      for (const key of ['correct_pids', ...keys]) {
        if (!/^\d+(\.\d+)?$/.test(row[key])) throw new Error('Missing replication result: ' + key);
      }
      return { model: row.model_name, score: Number(row.correct_pids),
        metrics: Object.fromEntries(keys.map(key => [key, Number(row[key])])) };
    }), 12);
  },
} satisfies Leaderboard;
