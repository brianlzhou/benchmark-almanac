// SUPERChem publishes per-model whole-set accuracy in its client app's JSON feed, already in percent.
// Multimodal and text-only are input configurations of the same task set. RPF is a diagnostic metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://superchem.pku.edu.cn/llm_overall_metrics.json';
interface Entry { model: string; modality: string; metrics: { acc?: number; std_acc?: number; rpf?: number; std_pass8?: number } }
const board: Leaderboard = {
  benchmark: 'superchem', url: 'https://superchem.pku.edu.cn/leaderboard', feed: FEED,
  terms: 'Official SUPERChem public leaderboard JSON; the dataset is MIT licensed. Benchmark Almanac credits and links the source.',
  aliases: {'qwen3-235b-a22b-instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025'},
  async fetch() {
    const data = await fetchJson<{ llm_overall_metrics: Entry[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data.llm_overall_metrics) {
      if (/human/i.test(r.model) || !Number.isFinite(r.metrics.acc)) continue;
      let model = r.model.replace(/(\d)_(\d)/g, '$1.$2');
      const effort = model.match(/_(minimal|low|medium|high)$/);
      if (effort) model = model.slice(0, effort.index);
      const think = model.includes('-think-');
      model = model.replace('-think-', '-').replace(/-128k$/, '');
      if (/^(?:gpt-4o|gemini-2\.5-pro)$/.test(model)) model += ' (snapshot unspecified)';
      const metrics: Record<string, number> = {};
      for (const [key, value] of Object.entries(r.metrics)) if (key !== 'acc' && typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
      rows.push({ model, score: r.metrics.acc!, setting: [r.modality, effort?.[1], think ? 'thinking' : undefined].filter(Boolean).join('; '), metrics });
    }
    if (!rows.length) throw new Error('SUPERChem feed has no model results');
    return rows;
  },
};
export default board;
