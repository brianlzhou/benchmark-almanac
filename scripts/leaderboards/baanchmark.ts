// Marek Dubovsky plays each model's sheep herding game and assigns it an ordinal rank, with first place best.
// The downloadable JSON supplies one record per run and links to the games.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://dubovskylabs.com/baa-benchmark/";
const feed = "https://dubovskylabs.com/data/baa-benchmark.json";
type Run = { rank: number, model: string, runtime: {en: string}, parameters: {en: string} | null,
  demo: string | null, followUpPromptCount: number | null,
  provenance: {testedAt: string | null, generatedAt: string | null, runType: string | null} };
const board: Leaderboard = {
  benchmark: 'baanchmark', url, feed,
  terms: "Dubovsky Labs allows this feed in robots.txt and offers it for download without a stated reuse license.",
  aliases: {
    'Qwen 3.8 Flash Q2': 'qwen3-8-flash-next', 'Qwen 3.8 27B ThinkingCap': 'qwen-3-8-27b',
    'DeepSeek V4 Flash 0731 DS4': 'deepseek-v4-flash-0731', 'GLM 5.3 Flash + Claude Code': 'glm-5-3-flash',
    'Qwen 3.6 27B MLX': 'qwen3-6-27b', 'Qwen 3.6 27B GGUF': 'qwen3-6-27b', 'Fable 5 UltraCode': 'claude-fable-5',
    'DeepSeek V4 Pro 0831': 'deepseek-v4-pro',
  },
  async fetch() {
    const data = await fetchJson<{benchmark: string, runs: Run[]}>(feed);
    if (data.benchmark !== 'baa' || data.runs.length < 68) throw new Error('Incomplete BAAnchmark ranking');
    return data.runs.map(r => {
      if (!r.model || !Number.isInteger(r.rank) || r.rank < 1) throw new Error('Invalid BAAnchmark rank');
      const params = r.parameters?.en.match(/^([\d.]+)([BT])$/);
      const variant = r.model.match(/ (ThinkingCap|MLX|GGUF|Q2|UltraCode|0831|DS4)$/)?.[1];
      const setting = [variant, r.provenance.runType].filter(Boolean).join(', ');
      return { model: r.model, score: r.rank, setting: setting || undefined,
        harness: r.model.includes('+ Claude Code') ? 'Claude Code' : undefined,
        link: r.demo ?? undefined, date: r.provenance.testedAt ?? r.provenance.generatedAt ?? undefined,
        open: r.runtime.en === 'Unknown' ? undefined : r.runtime.en.startsWith('Open-weight'),
        params: params ? Number(params[1]) * (params[2] === 'T' ? 1000 : 1) : undefined };
    });
  },
};
export default board;
