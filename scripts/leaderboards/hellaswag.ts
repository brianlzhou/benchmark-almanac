// HellaSwag tests whether a model can choose the most plausible ending to a passage.
// OpenCompass reports percentage accuracy in the Hellaswag column of its academic leaderboard.
// The Space joins its score matrix to model display names and sizes by model abbreviation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const base = 'https://opencompass.oss-cn-shanghai.aliyuncs.com/dev-assets/hf-research/';

interface Model {
  abbr: string;
  display_name: string;
  release_type: string;
  num_param: string;
}

const board: Leaderboard = {
  benchmark: 'hellaswag',
  host: 'OpenCompass',
  url: 'https://huggingface.co/spaces/opencompass/CompassAcademic-Leaderboard-Full-Version',
  feed: base + 'hf-academic.json',
  terms: 'The Space declares Apache 2.0. Hugging Face allows the Space in robots.txt. The public score host returns HTTP 403 for robots.txt.',
  aliases: {
    'DeepSeek-V3': 'deepseek-v3', 'Gemma-2-27B-it': 'gemma-2-27b', 'Gemma-2-9B-it': 'gemma-2-9b',
    'Llama3.1-8B-Instruct': 'llama-3-1-8b', 'Llama3.2-3B-Instruct': 'llama-3-2-3b',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b', 'Qwen2.5-14B-Instruct': 'qwen2-5-14b', 'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
  },
  async fetch() {
    const { Hellaswag } = await fetchJson<Record<string, Record<string, string>>>(board.feed);
    if (Hellaswag?.dataset !== 'hellaswag' || Hellaswag.metric !== 'accuracy')
      throw new Error('OpenCompass: HellaSwag accuracy column missing');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const models = await fetchJson<Model[]>(base + 'model-meta-info.json');
    const rows: LeaderboardRow[] = [];
    for (const model of models) {
      const value = Hellaswag[model.abbr];
      if (value === '-') continue;
      if (!model.display_name?.trim() || !/^\d+(?:\.\d+)?$/.test(value) || Number(value) > 100)
        throw new Error('OpenCompass: invalid HellaSwag row for ' + model.abbr);
      rows.push({
        model: model.display_name,
        score: Number(value),
        setting: Hellaswag.mode,
        open: model.release_type === 'OpenSource' ? true : undefined,
        params: /^\d+(?:\.\d+)?B$/.test(model.num_param) ? parseFloat(model.num_param) : undefined,
      });
    }
    if (rows.length < 17) throw new Error('OpenCompass: expected at least 17 HellaSwag scores, found ' + rows.length);
    return rows;
  },
};
export default board;
