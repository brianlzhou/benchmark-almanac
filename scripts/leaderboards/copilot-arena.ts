// Copilot Arena measures developer preferences for paired autocomplete suggestions. The initial
// leaderboard reports Elo, asymmetric confidence intervals, and median latency in seconds.
// Two independent transcription passes agreed on all nine rows of the hash-guarded November 2024 chart.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://cdn.sanity.io/images/ybjf12mv/migration/567510dd78425d6434eb23188a340d8b4b449b45-1426x748.jpg';
const board: Leaderboard = {
  benchmark:'copilot-arena', url:'https://arena.ai/blog/copilot-arena/', feed,
  stats: { latency: { name: 'Median latency', unit: 'seconds', better: 'lower' } },
  terms:'Arena publishes the chart with its dated leaderboard analysis. https://arena.ai/terms-of-use/',
  aliases:{ 'Deepseek V2.5':'deepseek-v2-5-sep-2024', 'Claude Sonnet 3.5 (06/20)':'claude-3-5-sonnet',
    'GPT-4o (08/06)':'gpt-4o-aug-2024', 'GPT-4o-mini (07/18)':'gpt-4o-mini',
    'Meta-Llama-3.1-405B-Instruct':'llama-3-1-405b','Meta-Llama-3.1-70B-Instruct':'llama-3-1-70b',
    'Gemini-1.5-Pro-002':'gemini-1-5-pro-sept-2024','Gemini-1.5-Flash-002':'gemini-1-5-flash-sep-2024' },
  async fetch() {
    const data = await chartRows(feed,'36a579d34b45eae1ed23c1c7335b44bfaa59af7d34e37f636ae18a0d32ab8514',[
      { model: 'Deepseek V2.5', score: 1074, low: 1063, high: 1090, metrics: { latency: 2.13 } },
      { model: 'Claude Sonnet 3.5 (06/20)', score: 1053, low: 1036, high: 1071, metrics: { latency: 2.29 } },
      { model: 'Codestral (05/24)', score: 1046, low: 1036, high: 1058, metrics: { latency: 1.01 } },
      { model: 'Meta-Llama-3.1-405B-Instruct', score: 1024, low: 1009, high: 1041, metrics: { latency: 1.12 } },
      { model: 'GPT-4o (08/06)', score: 1016, low: 996, high: 1033, metrics: { latency: 0.75 } },
      { model: 'Gemini-1.5-Pro-002', score: 1014, low: 996, high: 1033, metrics: { latency: 1.44 } },
      { model: 'Meta-Llama-3.1-70B-Instruct', score: 1013, low: 998, high: 1027, metrics: { latency: 0.88 } },
      { model: 'Gemini-1.5-Flash-002', score: 1005, low: 983, high: 1021, metrics: { latency: 0.55 } },
      { model: 'GPT-4o-mini (07/18)', score: 962, low: 947, high: 979, metrics: { latency: 0.74 } },
    ]);
    return checked(data.map(row=>({...row,date:'2024-11-11'})),9);
  },
};
export default board;
