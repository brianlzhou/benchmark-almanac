// MiJaBench measures how often a model defends against a harmful request.
// The authors define defense rate as the fraction of attempts that do not succeed.
// MiJaBench-Align publishes a verdict for each model and prompt in both languages.
import type { Leaderboard } from './types.ts';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { parquetReadObjects } from 'hyparquet';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const dataset = 'AKCIT/mijabench_align';
const feed = 'https://huggingface.co/api/datasets/' + dataset + '/tree/main/data';
interface Count { defended: number, total: number }
const board: Leaderboard = {
  benchmark: 'mijabench', feed, url: 'https://huggingface.co/datasets/' + dataset,
  terms: 'The authors permit safety evaluation and fairness auditing. https://huggingface.co/datasets/AKCIT/mijabench_align#intended-uses',
  aliases: { gpt_4o_mini_text: 'gpt-4o-mini', 'gemini_2.0_flash': 'gemini-2-0-flash-feb-2025',
    'Qwen3-1.7B-FP8': 'qwen3-1-7b', 'Qwen3-4B-FP8': 'qwen3-4b', 'Qwen3-8B-FP8': 'qwen3-8b', 'Qwen3-32B-FP8': 'qwen3-32b' },
  parts: { english: 'English', portuguese: 'Portuguese' },
  stats: {
    defended: { name: 'Defended attempts', unit: 'count' },
    prompts: { name: 'Prompts evaluated', unit: 'count' },
  },
  async fetch() {
    const files = (await fetchJson<{ type: string, path: string }[]>(feed)).filter(f => f.type === 'file' && f.path.endsWith('.parquet'));
    if (!files.length) throw Error('Missing MiJaBench verdict files');
    const models = new Map<string, Record<string, Count>>();
    for (const { path } of files) {
      const file = await fetchBytes('https://huggingface.co/datasets/' + dataset + '/resolve/main/' + path, {}, 2, 180000);
      const rows = await parquetReadObjects({ file, columns: ['response_model_name', 'language', 'jailbreak_success'] });
      for (const r of rows) {
        const { response_model_name: model, language, jailbreak_success: success } = r;
        if (typeof model !== 'string' || !['english', 'portuguese'].includes(language) || ![false, true, 0n, 1n, 0, 1].includes(success)) throw Error('Invalid verdict');
        const counts = models.get(model) ?? {};
        const c = counts[language] ??= { defended: 0, total: 0 };
        c.total++;
        if (!success) c.defended++;
        models.set(model, counts);
      }
    }
    return checked([...models].map(([model, { english, portuguese }]) => {
      if (english?.total !== 25981 || portuguese?.total !== 17980) throw Error('Incomplete prompt coverage for ' + model);
      const total = english.total + portuguese.total;
      return { model, setting: model.endsWith('-FP8') ? 'FP8' : undefined, score: 100 * (english.defended + portuguese.defended) / total,
        metrics: { english: 100 * english.defended / english.total, portuguese: 100 * portuguese.defended / portuguese.total,
          defended: english.defended + portuguese.defended, prompts: total } };
    }), 14);
  },
};
export default board;
