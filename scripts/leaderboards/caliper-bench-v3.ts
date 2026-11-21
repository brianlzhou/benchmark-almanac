// Caliper Bench ranks configurations by Creative Writing (CW) by default.
// Read the scoreboard's embedded data and column definitions. CW uncertainty uses the board's one-standard-error measure.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://caliperbench.com/";
const board: Leaderboard = {
  benchmark: "caliper-bench-v3",
  url: "https://caliperbench.com/",
  feed: FEED,
  terms: "The scoreboard embeds its data in the page and gives no separate reuse license. https://caliperbench.com/ The robots URL returns the scoreboard HTML.",
  stats: { rank: { name: 'Published rank', unit: 'count', better: 'lower' }, context_length: { name: 'Context length', unit: 'tokens' } },
  parts: { rp_score_v3: 'RP', erp_score_v3: 'ERP', drp_score_v3: 'DRP', combined_v3: 'Combined RP' },
  aliases: {
    "Claude Fable 5.2 (Anthropic)": "claude-fable-5-2",
    "Kimi K3.1 Pro (Moonshot)": "kimi-k3-1-pro",
    "Claude Opus 5.5 (Anthropic)": "claude-opus-5-5",
    "Kimi K3 (Moonshot)": "kimi-k3",
    "Claude Opus 4.7 (Anthropic)": "claude-opus-4-7",
    "Claude Sonnet 5.5 (Anthropic)": "claude-sonnet-5-5",
    "Claude Haiku 5.5 (Anthropic)": "claude-haiku-5-5",
    "GLM-5.3 (ZAI)": "glm-5-3",
    "Claude Fable 5 (Anthropic)": "claude-fable-5",
    "Claude Opus 4.8 (Anthropic)": "claude-opus-4-8",
    "Claude Sonnet 4.6 (Anthropic)": "claude-sonnet-4-6",
    "Kimi K2.6 (Moonshot)": "kimi-k2-6",
    "DeepSeek V4 Flash 0731 (DeepSeek)": "deepseek-v4-flash-0731",
    "DeepSeek V4.1 Flash 1017 (DeepSeek)": "deepseek-v4-1-flash-1017",
    "Claude Sonnet 5 (Anthropic)": "claude-sonnet-5",
    "DeepSeek V3.2 Thinking (DeepSeek)": "deepseek-v3-2",
    "DeepSeek V4 Flash Vision Exp (DeepSeek)": "deepseek-v4-flash-vision-exp",
    "Claude Haiku 4.5 (Anthropic)": "claude-haiku-4-5",
    "Mistral Large 3 (Mistral AI)": "mistral-large-3",
    "Mistral Large 4 (Mistral AI)": "mistral-large-4",
    "DeepSeek V4.1 Flash (DeepSeek)": "deepseek-v4-1-flash",
    "DeepSeek V3.2 (DeepSeek)": "deepseek-v3-2",
    "DeepSeek V3.1 Thinking (DeepSeek)": "deepseek-v3-1",
    "Qwen3.8 Flash Next (Alibaba)": "qwen3-8-flash-next",
    "DeepSeek V3.1 (DeepSeek)": "deepseek-v3-1",
    "DeepSeek R1 0528 (DeepSeek)": "deepseek-r1-may-2025",
    "Qwen3.5 35B-A3B (Alibaba)": "qwen3-5-35b-a3b",
    "Qwen3.5 122B-A10B (Alibaba)": "qwen3-5-122b-a10b",
    "Gemma 3 12B Instruct (Google)": "gemma-3-12b",
    "Llama 4 Scout 109B-A17B (Meta)": "llama-4-scout"
},
  async fetch() {
    const page = await fetchText(FEED);
    const expected = Number(page.match(/>([\d,]+) models · generated/)?.[1].replace(/,/g, ''));
    const data = jsonAfter<Record<string, unknown>[]>(page, 'const DATA = ');
    const cols = jsonAfter<{field: string; percent: boolean}[]>(page, 'const COLS = ');
    if (!expected || data.length !== expected || expected < 903 || !cols.some(c => c.field === 'cw_score_v3')) throw new Error('Caliper row count or CW column changed');
    return data.map(r => {
      const score = r.cw_score_v3;
      if (typeof score !== 'number' || typeof r.display_name !== 'string') throw new Error('Missing Caliper score');
      const metrics: Record<string, number> = {};
      for (const { field, percent } of cols) {
        const value = r[field];
        if (typeof value === 'number' && field !== 'cw_score_v3' && field !== 'parameter_count_b') metrics[field] = value * (percent ? 100 : 1);
      }
      const se = r.cw_se_v3;
      return { model: r.display_name, score, metrics,
        params: typeof r.parameter_count_b === 'number' ? r.parameter_count_b : undefined,
        link: typeof r.huggingface_url === 'string' ? r.huggingface_url : undefined,
        ...(typeof se === 'number' ? { low: score - se, high: score + se } : {}) };
    });
  },
};
export default board;
