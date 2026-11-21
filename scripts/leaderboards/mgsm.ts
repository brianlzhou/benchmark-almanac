// MGSM ranks models by overall accuracy. Vals AI also publishes accuracy for each test subset.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS } from './vals-index.ts';

import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const parts = {"mgsm_en":"English","mgsm_ja":"Japanese","mgsm_zh":"Chinese","mgsm_bn":"Bengali","mgsm_ru":"Russian","mgsm_de":"German","mgsm_fr":"French","mgsm_th":"Thai","mgsm_es":"Spanish","mgsm_te":"Telugu","mgsm_sw":"Swahili"};
const board: Leaderboard = {
  benchmark: 'mgsm',
  url: 'https://www.vals.ai/benchmarks/mgsm',
  feed: 'https://www.vals.ai/benchmarks/mgsm',
  terms: VALS_TERMS + ' The dataset is licensed CC BY 4.0.',
  host: 'Vals AI',
  aliases: { ...VALS_ALIASES, "GPT 4o (2024-08-06)": "gpt-4o-aug-2024", "GPT 4o (2024-11-20)": "gpt-4o-nov-2024", "Qwen 2.5 Instruct Turbo (72B)": "qwen2-5-72b", "together/mistralai/Mixtral-8x22B-Instruct-v0.1": "mixtral-8x22b", 'Llama 3.3 Nemotron Super (Thinking)': 'llama-3-3-nemotron-super-49b-v1', 'Llama 3.3 Nemotron Super (Nonthinking)': 'llama-3-3-nemotron-super-49b-v1' },
  parts,
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const html = await fetchText(this.url);
    const table = tables(html)[0];
    const path = html.match(/\/_astro\/benchmark_view_mgsm\.[\w-]+\.json/)?.[0];
    if (!path || table?.[0]?.[1]?.text !== 'Model' || table.length < 76) throw new Error('Missing MGSM ranking');
    await new Promise(resolve => setTimeout(resolve, 1050));
    const { tasks } = JSON.parse(await fetchText(new URL(path,this.url).href));
    return table.slice(1).map(r => {
      const slug = r[1].html.match(/href="\/models\/([^"]+)"/)?.[1];
      const key = Object.keys(tasks.overall).find(k => k.replaceAll('/','_') === slug);
      if (!key) throw new Error('Missing MGSM model: '+slug);
      const v = tasks.overall[key];
      const metrics: Record<string,number> = {};
      for (const part of Object.keys(parts)) {
        const score = tasks[part]?.[key]?.accuracy;
        if (!Number.isFinite(score)) throw new Error('Missing MGSM language: '+part);
        metrics[part] = score;
      }
      if (v.latency != null) metrics.latency = v.latency;
      const model = r[1].text.replace(/ \(\d{2}\/\d{2}\)$/, '');
      return { model, score: v.accuracy, setting: v.reasoning_effort || (key.endsWith('-thinking') ? 'thinking' : undefined), metrics,
        low: v.stderr == null ? undefined : v.accuracy-1.96*v.stderr, high: v.stderr == null ? undefined : v.accuracy+1.96*v.stderr,
        cost: v.cost_per_test ?? undefined, tokens: v.avg_output_tokens ?? undefined };
    });
  },
};
export default board;
