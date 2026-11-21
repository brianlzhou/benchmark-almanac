// MedBench tests Chinese medical language models across five medical evaluation dimensions.
// The score is the platform's overall score on MedBench, reported on a 0 to 100 scale.
// This importer reads the public MedBench evaluation ranking endpoint.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchJson} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://medbench.opencompass.org.cn/api/v1/base/evaluation/ranking';
const board: Leaderboard = {benchmark: 'medbench-opencompass', url: 'https://www.shlab.org.cn/news/5443852', feed: FEED, terms: 'MedBench public leaderboard. https://medbench.opencompass.org.cn/', async fetch() {
  const data = (await fetchJson<{data?: {llm?: {modelName: string; overallScore: string}[]}}>(FEED)).data?.llm ?? [];
  const rows: LeaderboardRow[] = data.map(r => ({model: r.modelName, score: Number(r.overallScore)}));
  return checked(rows, 2);
}};
export default board;
