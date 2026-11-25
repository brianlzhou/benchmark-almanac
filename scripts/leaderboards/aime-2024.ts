// Vals AI scores both AIME editions. This reader takes only 2024 accuracy, cost and timing from the annual split.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { tables } from "../lib/html.ts";
import { VALS_ALIASES, VALS_LATENCY_CHART } from "./vals-index.ts";
const board: Leaderboard = {
  benchmark: "aime-2024",
  url: "https://www.vals.ai/benchmarks/aime",
  feed: "https://www.vals.ai/benchmarks/aime",
  terms: "The page identifies https://creativecommons.org/licenses/by/4.0/ as its dataset license. Vals allows the benchmark in robots.txt.",
  host: "Vals AI",
  stats: {
    latency: { name: 'Latency', unit: 'seconds', better: 'lower' },
  },
  chart: VALS_LATENCY_CHART,
  aliases: { ...VALS_ALIASES, "GPT 4o (2024-08-06)": "gpt-4o-aug-2024", "GPT 4o (2024-11-20)": "gpt-4o-nov-2024", "Llama 3.3 Nemotron Super (Thinking)": "llama-3-3-nemotron-super-49b-v1", "Llama 3.3 Nemotron Super (Nonthinking)": "llama-3-3-nemotron-super-49b-v1" },
  async fetch() {
    const html = await fetchText(this.url);
    const table = tables(html)[0];
    const asset = html.match(/\/_astro\/benchmark_view_aime\.[\w-]+\.json/)?.[0];
    if (!asset || table?.[0]?.[1]?.text !== 'Model') throw new Error('Missing AIME leaderboard');
    await new Promise(resolve => setTimeout(resolve, 1050));
    const { tasks } = JSON.parse(await fetchText(new URL(asset,this.url).href));
    const runs = tasks.aime_2024;
    if (!runs || Object.keys(runs).length < 96 || Object.keys(runs).length !== table.length-1) throw new Error('Incomplete AIME 2024 split');
    return table.slice(1).map(r => {
      const slug = r[1].html.match(/href="\/models\/([^"#]+)"/)?.[1];
      const key = Object.keys(runs).find(k => k.replaceAll('/','_') === slug);
      const v = key && runs[key];
      if (!v || !Number.isFinite(v.accuracy)) throw new Error('Missing AIME 2024 result for '+slug);
      return { model: r[1].text.replace(/ \(\d{2}\/\d{2}\)$/, ''), score: v.accuracy, trials: 8,
        link: slug ? `https://www.vals.ai/models/${slug}` : undefined,
        low: v.stderr != null && v.stderr > 0 ? v.accuracy - 1.96 * v.stderr : undefined,
        high: v.stderr != null && v.stderr > 0 ? v.accuracy + 1.96 * v.stderr : undefined,
        cost: v.cost_per_test ?? undefined, tokens: v.avg_output_tokens ?? undefined,
        setting: v.reasoning_effort || (key!.endsWith('-thinking') ? 'thinking' : undefined),
        metrics: { ...(v.latency != null ? {latency:v.latency} : {}), ...(v.stderr != null ? {stderr:v.stderr} : {}) } };
    });
  },
};
export default board;
