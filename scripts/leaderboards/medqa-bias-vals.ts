// Vals AI ranks models by overall MedQA accuracy. Its chart JSON gives the six subset scores.
// The table links each model to its chart ID or prints that ID directly.
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { VALS_ALIASES, VALS_TERMS } from './vals-index.ts';

const parts = {
  unbiased: 'Unbiased', hispanic: 'Hispanic', black: 'Black',
  asian: 'Asian', white: 'White', indigenous: 'Indigenous',
};
interface Run {
  accuracy: number;
  latency?: number | null;
  cost_per_test?: number | null;
  stderr?: number | null;
  reasoning_effort?: string | null;
}

const board: Leaderboard = {
  benchmark: 'medqa-bias-vals',
  url: 'https://www.vals.ai/benchmarks/medqa',
  feed: 'https://www.vals.ai/benchmarks/medqa',
  terms: VALS_TERMS + ' The dataset is licensed CC BY 4.0.',
  host: 'Vals AI',
  aliases: {
    ...VALS_ALIASES,
    'Gemini 3.1 Pro Preview (02/26)': 'gemini-3-1-pro',
    'Gemini 3 Pro (11/25)': 'gemini-3-pro',
    'Gemini 3 Flash (12/25)': 'gemini-3-flash',
    'GPT 4o (2024-08-06)': 'gpt-4o-aug-2024',
    'Qwen 2.5 Instruct Turbo (72B)': 'qwen2-5-72b',
    'together/mistralai/Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
  },
  parts,
  stats: { priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' }, priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const html = await fetchText(this.url);
    const table = tables(html)[0];
    const headers = table?.[0]?.map(cell => cell.text);
    const path = html.match(/\/_astro\/benchmark_view_medqa\.[\w-]+\.json/)?.[0];
    if (!path || headers?.[1] !== 'Model' || headers[2] !== 'Accuracy' || headers[3] !== 'Cost In / Out') {
      throw new Error('Missing MedQA ranking or chart data');
    }
    await new Promise(resolve => setTimeout(resolve, 1050));
    const { tasks } = await fetchJson<{ tasks: Record<string, Record<string, Run>> }>(new URL(path, this.url).href);
    const keys = Object.keys(tasks.overall);
    const bySlug = new Map(keys.map(key => [key.replaceAll('/', '_'), key]));
    const seen = new Set<string>();
    if (keys.length < 95 || keys.length !== table.length - 1) throw new Error('Incomplete MedQA ranking');
    return table.slice(1).map(row => {
      const model = row[1].text;
      const slug = row[1].html.match(/href="\/models\/([^"]+)"/)?.[1];
      const key = slug ? bySlug.get(slug) : model;
      const run = key && tasks.overall[key];
      const shown = num(row[2].text);
      if (!key || !run || seen.has(key) || !Number.isFinite(run.accuracy) || shown == null || Math.abs(run.accuracy - shown) > 0.0051) {
        throw new Error('Unmatched MedQA run for ' + model);
      }
      seen.add(key);
      const metrics: Record<string, number> = {};
      for (const part of Object.keys(parts)) {
        const score = tasks[part]?.[key]?.accuracy;
        if (!Number.isFinite(score)) throw new Error('Missing MedQA ' + part + ' score for ' + model);
        metrics[part] = score;
      }
      if (run.latency != null) metrics.latency = run.latency;
      const prices = row[3].text.match(/^\$([\d.,]+)\s*\/\s*\$([\d.,]+)$/);
      if (prices) {
        metrics.priceIn = Number(prices[1].replaceAll(',', ''));
        metrics.priceOut = Number(prices[2].replaceAll(',', ''));
      }
      return {
        model, score: run.accuracy, metrics, cost: run.cost_per_test ?? undefined,
        setting: run.reasoning_effort || (key.endsWith('-thinking') ? 'thinking' : undefined),
        low: run.stderr == null ? undefined : run.accuracy - 1.96 * run.stderr,
        high: run.stderr == null ? undefined : run.accuracy + 1.96 * run.stderr,
      };
    });
  },
};
export default board;
