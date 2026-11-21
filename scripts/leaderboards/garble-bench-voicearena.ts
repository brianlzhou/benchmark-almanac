// Garble-Bench tests voice agents on corrupted speech, entity edits, recovery and call conduct.
// The repository's scorer reports transactional and conversational task completion as separate rates.
// This importer records their plain mean and keeps the checked scorer dimensions as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://github.com/Voice-Arena/Garble-Bench';
const board: Leaderboard = {
  benchmark: 'garble-bench-voicearena', url: FEED, feed: FEED,
  terms: 'The repository does not state a separate license for its benchmark results. Link and attribute the source.',
  headline: 'The source reports no overall score, so this is the plain mean of transactional and conversational task completion.',
  parts: {
    transactional: { name: 'Transactional task completion', group: 'Domain', unit: 'score' },
    conversational: { name: 'Conversational task completion', group: 'Domain', unit: 'score' },
  },
  stats: {
    transactionalTaskCompletion: { name: 'Transactional task completion', unit: 'score', better: 'higher', note: 'Fraction completed, from 0 to 1.' }, conversationalTaskCompletion: { name: 'Conversational task completion', unit: 'score', better: 'higher', note: 'Fraction completed, from 0 to 1.' },
    entityFidelity: { name: 'Entity fidelity', unit: 'score', better: 'higher', note: 'Fraction of entities preserved, from 0 to 1.' }, functionFloorTransactional: { name: 'Transactional function floor', unit: 'score', better: 'higher', note: 'Fraction meeting the transactional function floor, from 0 to 1.' }, functionFloorConversational: { name: 'Conversational function floor', unit: 'score', better: 'higher', note: 'Fraction meeting the conversational function floor, from 0 to 1.' },
  },
  aliases: { 'GLM-4.7 Flash': 'glm-4-7', 'Qwen3 30B-A3B': 'qwen3-30b-a3b', 'Qwen3 32B': 'qwen3-32b' },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [
      { model: 'Gemini 3.8 Flash', score: 0.98, metrics: { transactionalTaskCompletion: 1, conversationalTaskCompletion: 0.96, entityFidelity: 1, functionFloorTransactional: 0.8, functionFloorConversational: 1 } },
      { model: 'GPT-6 Luna Pro', score: 0.92425, metrics: { transactionalTaskCompletion: 1, conversationalTaskCompletion: 0.8485, entityFidelity: 1, functionFloorTransactional: 0.75, functionFloorConversational: 1 } },
      { model: 'GPT-6 Luna', score: 0.93455, metrics: { transactionalTaskCompletion: 0.9091, conversationalTaskCompletion: 0.96, entityFidelity: 1, functionFloorTransactional: 0.65, functionFloorConversational: 1 } },
      { model: 'Gemini 3.1 Pro', score: 0.96, metrics: { transactionalTaskCompletion: 1, conversationalTaskCompletion: 0.92, entityFidelity: 1, functionFloorTransactional: 0.75, functionFloorConversational: 0.8667 } },
      { model: 'GLM-4.7 Flash', score: 0.81455, metrics: { transactionalTaskCompletion: 0.9091, conversationalTaskCompletion: 0.72, entityFidelity: 1, functionFloorTransactional: 0.8, functionFloorConversational: 0.7333 } },
      { model: 'Qwen3 30B-A3B', score: 0.6285, metrics: { transactionalTaskCompletion: 0.697, conversationalTaskCompletion: 0.56, entityFidelity: 0.8667, functionFloorTransactional: 0.75, functionFloorConversational: 0.7333 } },
      { model: 'Qwen3 32B', score: 0.7085, metrics: { transactionalTaskCompletion: 0.697, conversationalTaskCompletion: 0.72, entityFidelity: 0.8, functionFloorTransactional: 0.8, functionFloorConversational: 0.8667 } },
      { model: 'Mercury 2.5', score: 0.7994, metrics: { transactionalTaskCompletion: 0.8788, conversationalTaskCompletion: 0.72, entityFidelity: 0.6667, functionFloorTransactional: 0.7, functionFloorConversational: 0.8667 } },
    ];
    return checked(rows, 8);
  },
};
export default board;
