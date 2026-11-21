// Open FlagEval VLM Leaderboard evaluates open vision language models on twelve
// visual understanding tasks. The leaderboard code averages task accuracy from
// one JSON result file per model in the public Hugging Face dataset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/spaces/BAAI/open_flageval_vlm_leaderboard';
const API = 'https://huggingface.co/api/datasets/open-cn-llm-leaderboard/vlm_results/tree/main?recursive=true';
const ROOT = 'https://huggingface.co/datasets/open-cn-llm-leaderboard/vlm_results/resolve/main/';
const TASKS = ['CMMMU', 'MMMU', 'MMMU_Pro_standard', 'MMMU_Pro_vision', 'MathVision', 'CII-Bench', 'Blink', 'CharXiv', 'MathVerse', 'MmvetV2', 'Ocrlite', 'OcrliteZh'];
interface TreeEntry { type?: string; path?: string }
interface Result { config_general?: { model_name?: string }; results?: Record<string, { acc?: number; accuracy?: number }> }

const board: Leaderboard = {
  benchmark: 'open-flageval-vlm-leaderboard', url: PAGE, feed: `${API} and each model result JSON`,
  terms: 'The public Hugging Face dataset and Space do not state separate score reuse terms.',
  parts: Object.fromEntries(TASKS.map((task) => [task.replace(/[^A-Za-z0-9]/g, ''), { name: task, group: 'Task' }])),
  async fetch() {
    const tree = await fetchJson<TreeEntry[]>(API);
    const paths = tree.filter((entry) => entry.type === 'file' && /\/results_[^/]+\.json$/.test(entry.path ?? '')).map((entry) => entry.path!);
    const rows: LeaderboardRow[] = [];
    for (const path of paths) {
      const result = JSON.parse(await fetchText(ROOT + path)) as Result;
      const values = TASKS.map((task) => result.results?.[task]?.acc ?? result.results?.[task]?.accuracy).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      if (!result.config_general?.model_name || values.length < 6) continue;
      const metrics: Record<string, number> = {};
      for (const task of TASKS) {
        const value = result.results?.[task]?.acc ?? result.results?.[task]?.accuracy;
        if (typeof value === 'number' && Number.isFinite(value)) metrics[task.replace(/[^A-Za-z0-9]/g, '')] = value;
      }
      rows.push({ model: result.config_general.model_name, score: values.reduce((sum, value) => sum + value, 0) / values.length, metrics });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (rows.length < 40) throw new Error(`Open FlagEval VLM: ${rows.length} models, expected at least 40`);
    return rows;
  },
};
export default board;
