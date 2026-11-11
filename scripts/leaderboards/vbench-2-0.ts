// VBench-2.0: read the live Gradio dataframe identified by its five intrinsic-faithfulness categories.
// Total Score is already a percentage. Keep all category and dimension scores as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const FEED = 'https://vchitect-vbench-leaderboard.hf.space/config';
const board: Leaderboard = {
  benchmark: 'vbench-2-0', url: 'https://huggingface.co/spaces/Vchitect/VBench_Leaderboard', feed: FEED,
  terms: 'Vchitect publishes these results through its public Hugging Face Space. Benchmark Almanac credits and links the source.',
  async fetch() {
    const d = await fetchJson<{components: {type:string; props:{value?:{headers:string[]; data:unknown[][]}}}[]}>(FEED);
    const t = d.components.find(c => c.type === 'dataframe' && c.props.value?.headers.includes('Human Fidelity Score'))?.props.value;
    if (!t) throw new Error('VBench-2.0 dataframe missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.data) {
      const score = num(String(r[t.headers.indexOf('Total Score')]));
      const model = String(r[0]).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      if (score === undefined || !model) continue;
      const metrics: Record<string, number> = {};
      t.headers.forEach((h,i) => { const value = i > 6 ? num(String(r[i] ?? '')) : undefined; if (value !== undefined) metrics[h] = value; });
      const date = String(r[t.headers.indexOf('Date')]);
      rows.push({model, score, date: /^\d{4}-\d\d-\d\d$/.test(date) ? date : undefined, metrics});
    }
    if (!rows.length) throw new Error('VBench-2.0 scores missing');
    return rows;
  },
};
export default board;
