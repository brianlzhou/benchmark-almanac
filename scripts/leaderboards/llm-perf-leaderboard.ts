// Hugging Face ranks each hardware table first by Open LLM Score. The public Space embeds its default result tables with experiment names and inference measurements.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text, num } from '../lib/html.ts';

const feed = "https://optimum-llm-perf-leaderboard.hf.space/config";

const board: Leaderboard = {
  benchmark: "llm-perf-leaderboard",
  url: "https://huggingface.co/spaces/optimum/llm-perf-leaderboard",
  feed,
  terms: "Check the publisher’s terms at https://huggingface.co/spaces/optimum/llm-perf-leaderboard Hugging Face allows the public Space in robots.txt.",
  stats:{prefillSeconds:{name:'Prefill time',unit:'seconds',better:'lower'},tokensPerSecond:{name:'Decode speed',unit:'tokens/s',better:'higher'},memoryMB:{name:'Memory',unit:'millions'},tokensPerKwh:{name:'Tokens per kilowatt hour',unit:'tokens/s',better:'higher'}},
  async fetch() {
    type Table = { headers: string[]; data: (string | number | null)[][] };
    type Component = { type: string; props: { label?: string; value?: Table } };
    const { components } = await fetchJson<{ components: Component[] }>(feed);
    const rows: LeaderboardRow[] = [];
    let hardware = '';
    for (const c of components) {
      if (c.type === 'tabitem' && c.props.label?.includes('🖥')) hardware = c.props.label.replace(/🖥️?/u, '').trim();
      if (c.type !== 'dataframe') continue;
      const t = c.props.value;
      const cols = ['Model 🤗', 'Experiment 🧪', 'Prefill (s)', 'Decode (tokens/s)', 'Memory (MB)', 'Energy (tokens/kWh)', 'Open LLM Score (%)'];
      if (!hardware || !t || cols.some((v,i) => t.headers[i] !== v)) throw new Error('Unexpected LLM-Perf hardware table');
      for (const r of t.data) {
        const [label, experiment, prefill, decode, memory, energy, quality] = r;
        const model = text(String(label)), score = num(String(quality));
        if (!model || !experiment || score == null) throw new Error('Missing LLM-Perf score or experiment');
        const metrics: Record<string, number> = {};
        for (const [i,k] of ['prefillSeconds','tokensPerSecond','memoryMB','tokensPerKwh'].entries()) {
          const v = [prefill, decode, memory, energy][i];
          if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
        }
        rows.push({ model, setting: hardware + ' / ' + experiment, score, link: String(label).match(/href="([^"]+)"/)?.[1], metrics });
      }
    }
    if (rows.length < 3295) throw new Error('Missing LLM-Perf hardware experiments');
    return rows;
  },
};

export default board;
