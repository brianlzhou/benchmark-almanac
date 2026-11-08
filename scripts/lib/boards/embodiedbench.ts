// EmbodiedBench's four headline tables rank the published environment average success rate (%).
// Capability subsets remain metrics. The feed's average is used directly, never recomputed.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';

const BASE = 'https://embodiedbench.github.io/website/data/';
const PREFIX = { alfred: 'eb_alfred', habitat: 'eb_habitat', navigation: 'eb_nav', manipulation: 'eb_mani' } as const;
export function embodiedbenchBoard(track: keyof typeof PREFIX): Leaderboard {
  const feed = `${BASE}eb_${track}_total_benchmark.json`, prefix = PREFIX[track];
  return {
    benchmark: `embodiedbench-eb-${track}`, url: 'https://embodiedbench.github.io/', feed,
    terms: 'The authors publish these JSON tables on their project site, which credits a CC BY-SA 4.0 license.',
    aliases: { 'Llama-3.2-90B-Vision-Ins': 'llama-3-2-90b', 'Llama-3.2-11B-Vision-Ins': 'llama-3-2-11b', 'Qwen2-VL-72B-Ins': 'qwen2-vl-72b-instruct', 'Qwen2-VL-7B-Ins': 'qwen2-vl-7b-instruct', 'Qwen2.5-VL-72B-Ins': 'qwen2-5-vl-72b', 'Qwen2.5-VL-7B-Ins': 'qwen2-5-vl-7b', 'gemma-3-12b-it': 'gemma-3-12b' },
    async fetch() {
      const rows: LeaderboardRow[] = [];
      const data = await fetchJson<({ model: string } & Record<string, string | number>)[]>(feed);
      for (const r of data) {
        const score = r[`${prefix}_avg`];
        if (typeof score !== 'number' || !Number.isFinite(score)) continue;
        let model = r.model.replace('GPT-4o mini', 'GPT-4o-mini').replace('InternVL2_5', 'InternVL2.5');
        if (/^(GPT-4o(?:-mini)?|Claude-3\.5-Sonnet|Gemini-(?:1\.5-(?:Pro|flash)|2\.0-flash)|Qwen-VL-Max)$/i.test(model)) model += ' (snapshot unspecified)';
        const metrics: Record<string, number> = {};
        for (const [key, value] of Object.entries(r)) {
          if (key !== `${prefix}_avg` && key.startsWith(prefix + '_') && typeof value === 'number' && Number.isFinite(value)) metrics[key.slice(prefix.length + 1)] = value;
        }
        rows.push({ model, score, metrics });
      }
      if (!rows.length) throw new Error(`EmbodiedBench ${track}: no average rows`);
      return rows;
    },
  };
}
