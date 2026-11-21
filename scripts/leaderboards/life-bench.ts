// Life-Bench evaluates multimodal personal-context question answering across 10 tasks.
// The headline score is the README's Overall accuracy, converted from 0 to 1 to percent.
// This importer reads the Evaluation Results table in the authors' repository README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/google-deepmind/life-bench/main/README.md';
const rows: LeaderboardRow[] = [
  { model: 'Gemma 3 12B', harness: 'BM25', score: 51.59, metrics: { textConceptQa: 86.50, visualConceptRecognition: 83.20, conceptVqa: 62.49, sceneAndActivity: 66.98, directPersonCentric: 36.48, relationalPersonCentric: 49.23, fineGrainedScene: 49.62, preferenceAndPersona: 55.93, relationalTemporal: 10.80, frequencyAndCounting: 14.72 } },
  { model: 'Gemma 3 12B', harness: 'RAG-Cap', score: 48.59, metrics: { textConceptQa: 84.05, visualConceptRecognition: 76.50, conceptVqa: 52.36, sceneAndActivity: 48.43, directPersonCentric: 28.95, relationalPersonCentric: 37.86, fineGrainedScene: 56.71, preferenceAndPersona: 70.51, relationalTemporal: 14.28, frequencyAndCounting: 16.23 } },
  { model: 'Gemma 3 12B', harness: 'RAP-Gemma', score: 41.67, metrics: { textConceptQa: 76.51, visualConceptRecognition: 74.98, conceptVqa: 47.44, sceneAndActivity: 30.43, directPersonCentric: 16.88, relationalPersonCentric: 24.67, fineGrainedScene: 51.72, preferenceAndPersona: 71.19, relationalTemporal: 15.33, frequencyAndCounting: 7.55 } },
  { model: 'Gemma 3 12B', harness: 'R2P-Gemma', score: 39.93, metrics: { textConceptQa: 70.55, visualConceptRecognition: 69.43, conceptVqa: 35.59, sceneAndActivity: 32.44, directPersonCentric: 26.64, relationalPersonCentric: 34.88, fineGrainedScene: 43.38, preferenceAndPersona: 58.31, relationalTemporal: 17.15, frequencyAndCounting: 10.94 } },
  { model: 'Gemma 3 12B', harness: 'HippoRAG2', score: 45.62, metrics: { textConceptQa: 80.98, visualConceptRecognition: 84.94, conceptVqa: 65.42, sceneAndActivity: 39.78, directPersonCentric: 20.94, relationalPersonCentric: 32.01, fineGrainedScene: 43.56, preferenceAndPersona: 55.59, relationalTemporal: 16.72, frequencyAndCounting: 16.23 } },
  { model: 'Gemma 3 12B', harness: 'LifeGraph (d=2)', score: 55.69, metrics: { textConceptQa: 75.87, visualConceptRecognition: 83.32, conceptVqa: 53.18, sceneAndActivity: 72.42, directPersonCentric: 50.92, relationalPersonCentric: 51.93, fineGrainedScene: 51.57, preferenceAndPersona: 67.46, relationalTemporal: 32.40, frequencyAndCounting: 17.85 } },
  { model: 'Gemma 3 12B', harness: 'LifeGraph (d=3)', score: 56.04, metrics: { textConceptQa: 79.14, visualConceptRecognition: 82.78, conceptVqa: 52.60, sceneAndActivity: 72.28, directPersonCentric: 49.84, relationalPersonCentric: 53.48, fineGrainedScene: 52.53, preferenceAndPersona: 65.24, relationalTemporal: 32.75, frequencyAndCounting: 19.76 } },
];

const board: Leaderboard = {
  benchmark: 'life-bench',
  url: 'https://github.com/google-deepmind/life-bench',
  feed: FEED,
  terms: 'The authors publish this repository under the Apache License 2.0. https://github.com/google-deepmind/life-bench/blob/main/LICENSE',
  parts: {
    textConceptQa: { name: 'Text Concept QA', group: 'Task' },
    visualConceptRecognition: { name: 'Visual Concept Recognition', group: 'Task' },
    conceptVqa: { name: 'Concept VQA', group: 'Task' },
    sceneAndActivity: { name: 'Scene and Activity', group: 'Task' },
    directPersonCentric: { name: 'Direct Person-Centric', group: 'Task' },
    relationalPersonCentric: { name: 'Relational Person-Centric', group: 'Task' },
    fineGrainedScene: { name: 'Fine-Grained Scene', group: 'Task' },
    preferenceAndPersona: { name: 'Preference and Persona', group: 'Task' },
    relationalTemporal: { name: 'Relational Temporal', group: 'Task' },
    frequencyAndCounting: { name: 'Frequency and Counting', group: 'Task' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await fetchText(FEED);
    for (const [method, score] of [['BM25', '0.5159'], ['RAG-Cap', '0.4859'], ['LifeGraph ($d=3$)', '0.5604']] as const) {
      if (!source.includes(`| ${method} |`) || !source.includes(`| ${method} |` + ' ')) throw new Error(`Life-Bench README: missing ${method}`);
      if (!source.includes(`| ${method} |`) || !source.includes(score)) throw new Error(`Life-Bench README: missing ${method} score ${score}`);
    }
    return checked(rows, 7);
  },
};

export default board;
