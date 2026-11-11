// The site's script loads this JSON. Only overall records supply headline scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://syuchin.github.io/MARS-Bench/static/data/mars_leaderboard_data.json';
const board: Leaderboard = {
 benchmark: 'mars-bench', url: 'https://syuchin.github.io/MARS-Bench/', feed: FEED,
 terms: 'Public academic project data; the site credits CC BY-SA 4.0. The almanac credits and links the source.',
 aliases: {'o1-1217': 'o1', 'GPT-4.5-Preview': 'gpt-4-5', 'Grok3': 'grok-3', 'o4-mini-0416': 'o4-mini', 'GPT-4o-1120': 'gpt-4o-nov-2024', 'GPT-4.1-mini-0414': 'gpt-4-1-mini', 'DeepSeek-V3-1226': 'deepseek-v3'},
 async fetch() {
  const data = await fetchJson<Record<string, unknown>[]>(FEED);
  return data.filter(r => r.type === 'overall' && r.Overall !== '' && Number.isFinite(Number(r.Overall))).map(r => {
   let model = String(r.model).replace(/-Thinking$/i, '');
   if (/^(Gemini-2.5-(Pro|Flash)|DeepSeek-(R1|V3))$/.test(model)) model += ' (snapshot unspecified)';
   const metrics: Record<string, number> = {};
   for (const k of ['Instruction Following', 'Context Retrieval', 'Information Reasoning', 'Task Switching']) if (r[k] !== undefined && Number.isFinite(Number(r[k]))) metrics[k] = Number(r[k]);
   return {model, score: Number(r.Overall), setting: r.thinking ? 'thinking' : undefined, metrics};
  });
 },
};
export default board;
