// MMLongBench-Doc: the official Space JSON reports accuracy in percent. Model details retain the visual detail setting, modality, and parameter count. The MoE flag identifies mixture-of-experts models. Monthly release labels are not treated as exact evaluation dates.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/OpenIXCLab/mmlongbench-doc/resolve/main/leaderboard_data.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "mmlongbench-doc",
  url: "https://huggingface.co/spaces/OpenIXCLab/mmlongbench-doc",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {"Claude 4.5 Opus": "claude-opus-4-5", "GLM-4.1V-Thinking": "glm-4-1v-9b-thinking", "Kimi-VL-Thinking-2506": "kimi-vl-a3b-thinking-2506", "NVIDIA Nemotron 3 Nano Omni 30B A3B": "nemotron-3-nano-omni-30b-a3b"},
  
  async fetch() {
    const p = await fetchJson<{ leaderboard: { model: string; acc: number; params: string; modality: string; params_b: number | null; open_source?: boolean; moe?: boolean }[] }>(FEED);
    const rows = p.leaderboard.filter(r => r.model && Number.isFinite(r.acc)).map(r => ({
      model: identity(r.model.replace(/ detail high$/, '')),
      score: r.acc,
      open: typeof r.open_source === 'boolean' ? r.open_source : undefined,
      params: /([\d.]+)B total/i.test(r.params) ? Number(r.params.match(/([\d.]+)B total/i)![1]) : /^([\d.]+)B$/.test(r.params) ? Number(r.params.slice(0, -1)) : undefined,
      setting: `${r.modality}; ${r.params}${/ detail high$/.test(r.model) ? '; detail high' : ''}`,
      metrics: {
        ...(typeof r.moe === 'boolean' ? { mixtureOfExperts: Number(r.moe) } : {}),
        ...(r.params_b == null ? {} : { activeParametersBillions: r.params_b, ...(r.moe ? { activeParams: r.params_b } : {}) }),
      },
    }));
    if (!rows.length) throw new Error('MMLongBench-Doc leaderboard missing');
    return rows;
  },
};
export default board;
