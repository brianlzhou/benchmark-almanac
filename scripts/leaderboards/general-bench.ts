// General-Bench evaluates comprehension and generation across modalities. The full Scope-A board calls its
// Level-2 overall score "the average score between Comprehension and Generation tasks (i.e., across all tasks)".
// Higher levels measure different forms of synergy on the same tasks. Their scores remain separate metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://generalist.top/leaderboard-scope-a';
type Entry = { model: string, date: string, score_overall: number, score_image: number, score_video: number,
  score_audio: number, score_3d: number };
function data<T>(html: string, variable: string): T {
  const marker = 'const ' + variable + " = JSON.parse('";
  const encoded = html.split(marker)[1]?.split("');")[0];
  if (!encoded) throw new Error('Missing ' + variable);
  return JSON.parse(encoded.replace(/\\u([0-9a-f]{4})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))));
}
const board: Leaderboard = {
  benchmark: 'general-bench', url: feed, feed, terms: 'General-Level reserves copyright on its full Scope-A leaderboard. https://generalist.top/leaderboard-scope-a',
  parts: { image: 'Image', video: 'Video', audio: 'Audio', threeD: '3D' },
  stats: {
    level3: { name: 'Level 3 synergy score', unit: 'score', better: 'higher' },
    level4: { name: 'Level 4 synergy score', unit: 'score', better: 'higher' },
    level5: { name: 'Level 5 synergy score', unit: 'score', better: 'higher' },
  },
  aliases: {
    'Qwen2-Audio-Instruct': 'qwen2-audio-7b-instruct', 'LLaVA-NeXT-34B': 'llava-v1-6-34b', 'LLaVA-One-Vision-72B': 'llava-onevision-72b', 'Gemma-2-9b-it': 'gemma-2-9b',
    'Meta-Llama-3.1-8B-Instruct': 'llama-3-1-8b', 'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
  },
  async fetch() {
    const html = await fetchText(feed);
    const level2 = data<Entry[]>(html, 'data_table_l2_full');
    const summary = data<({ name: string } & Record<string, number>)[]>(html, 'generalist_levels_full_data');
    const byName = new Map(summary.map(row => [row.name, row]));
    const models = new Map<string, LeaderboardRow>();
    for (const entry of level2) {
      const { model, score_overall: score, date } = entry;
      const levels = byName.get(model);
      if (!levels) throw new Error('Missing synergy scores for ' + model);
      const metrics = { image: entry.score_image, video: entry.score_video, audio: entry.score_audio, threeD: entry.score_3d,
        level3: levels.level_3, level4: levels.level_4, level5: levels.level_5 };
      if (![score, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Invalid Scope-A columns');
      const row = { model, score, date: date.replaceAll('/', '-'), metrics };
      if (models.has(model) && JSON.stringify(models.get(model)) !== JSON.stringify(row)) throw new Error('Conflicting rows for ' + model);
      models.set(model, row);
    }
    const rows = [...models.values()];
    checked(rows.map(row => ({ ...row })), 102);
    return rows;
  },
};
export default board;
