// 67AI Lab measures exact cell matches for trial results extraction. Its results table gives median accuracy and separate greedy runs.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://67ailab.com/posts/spark-eval-07-l4-trial-extraction/";
const board: Leaderboard = {
  benchmark: 'llm-meta-analysis',
  url: "https://67ailab.com/posts/spark-eval-07-l4-trial-extraction/",
  feed,
  terms: "The publisher allows crawling. The publisher gives no separate reuse terms for the score table. https://67ailab.com/posts/spark-eval-07-l4-trial-extraction/",
  host: '67AI Lab',
  aliases: { 'Opus 5.5': 'claude-opus-5-5', 'Nemotron 3.5 30B-A3B': 'nemotron-3-5-lightning-30b-a3b' },
  async fetch() {
    const all = tables(await fetchText(feed));
    const main = all.find(t => t[0].map(c => c.text).join('|') === 'Model|Exact (median)|Greedy|Cells the key fills|Whole row right|Δ Opus|Verdict');
    const errors = all.find(t => t[0]?.[1]?.text === 'Null where the key has a value');
    if (!main || main.length < 8 || !errors) throw new Error('Missing trial extraction tables');
    const labels: Record<string,string> = { 'DeepSeek-V4.1-Flash': 'DeepSeek', 'Qwen3.6-35B-A3B': 'Qwen3.6', 'Qwen3.8-27B': 'Qwen3.8', 'Gemma 4 26B-A4B': 'Gemma 4', 'Nemotron 3.5 30B-A3B': 'Nemotron 3.5' };
    const rows = [];
    for (const c of main.slice(1)) {
      const model = c[0].text, error = errors.find(r => r[0].text === (labels[model] || model));
      if (!model || !error) throw new Error('Missing trial extraction model');
      const values = [c[1], c[3], c[4], ...error.slice(1)].map(v => num(v.text));
      if (values.length !== 6 || values.some(v => v == null)) throw new Error('Incomplete trial extraction row');
      rows.push({ model, setting: 'Exact (median)', score: values[0]!, metrics: { filled: values[1]!, wholeRow: values[2]!, missing: values[3]!, extra: values[4]!, wrong: values[5]! } });
      const greedy = num(c[2].text);
      if (greedy != null) rows.push({ model, setting: 'Greedy', score: greedy });
    }
    return rows;
  },
};
export default board;
