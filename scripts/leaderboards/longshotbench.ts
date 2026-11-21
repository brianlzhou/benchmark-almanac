// LongShOT's overall score over all categories, modalities and durations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, num } from '../lib/html.ts';
const URL = 'https://longshot.cvmbzuai.com/leaderboard';
const board: Leaderboard = {
  benchmark: 'longshotbench', stats: { activeParams: { name: 'Active parameters', unit: 'billions' } }, parts: {
  Visual: { name: 'Visual', group: 'Modality' },
  Audio: { name: 'Audio', group: 'Modality' },
  Speech: { name: 'Speech', group: 'Modality' },
  Short: { name: 'Short', group: 'Length' },
  Long: { name: 'Long', group: 'Length' },
  CP: { name: 'Core perception', group: 'Category' },
  RE: { name: 'Reasoning', group: 'Category' },
  Info: { name: 'Information', group: 'Category' },
  MM: { name: 'Multimodal', group: 'Category' },
  Med: { name: 'Medium', group: 'Length' },
}, url: URL, feed: URL + ' (overall results table)',
  terms: 'LongShOT is CC BY-NC-SA 4.0. The public board permits this path in robots.txt. Source: LongShOT authors, MBZUAI.',
  harnesses: 'system',
  aliases: {"Phi-4-R-Vision-15B": "phi-4-reasoning-vision-15b", "GLM-4.1V-9B-T": "glm-4-1v-9b-thinking", "Kimi-VL-A3B-I": "kimi-vl-a3b-instruct", "Qwen2.5-VL-3B-I": "qwen2-5-vl-3b", "Qwen2.5-VL-7B-I": "qwen2-5-vl-7b", "Qwen2.5-VL-32B-I": "qwen2-5-vl-32b", "Qwen2.5-VL-72B-I": "qwen2-5-vl-72b", "Qwen3-VL-2B-I": "qwen3-vl-2b-instruct", "Qwen3-VL-2B-T": "qwen3-vl-2b-thinking", "Qwen3-VL-4B-I": "qwen3-vl-4b-instruct", "Qwen3-VL-4B-T": "qwen3-vl-4b-thinking", "Qwen3-VL-8B-I": "qwen3-vl-8b-instruct", "Qwen3-VL-8B-T": "qwen3-vl-8b-thinking", "Qwen3-VL-32B-I": "qwen3-vl-32b-instruct", "Qwen3-VL-32B-T": "qwen3-vl-32b-thinking", "Qwen3-VL-30B-A3B-I": "qwen3-vl-30b-a3b-instruct", "Qwen3-VL-30B-A3B-T": "qwen3-vl-30b-a3b-thinking", "Qwen3-VL-235B-A22B-I": "qwen3-vl-235b-a22b-instruct"},
  async fetch() {
    const t = tables(await fetchText(URL)).find(t => t[1]?.[4]?.text === 'Overall');
    if (!t) throw new Error('LongShOT results table missing');
    const rows: LeaderboardRow[] = t.slice(2).map(r => {
      const model = text(r[1].html.match(/<span class="min-w-0 break-words sm:truncate">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const score = num(r[4].text);
      if (!model || score === undefined) throw new Error('LongShOT model or score missing');
      const size = r[2].text.match(/^(\d+(?:\.\d+)?)(B|T)/);
      const active = r[2].text.match(/\((\d+(?:\.\d+)?)B active\)/);
      const mode = model.endsWith('-T') ? 'thinking' : model.endsWith('-I') ? 'instruct' : undefined;
      return {model, score, open: /Closed-source API/i.test(r[1].text) ? false : /open.source/i.test(r[1].text) ? true : undefined,
        setting: [`input: ${r[3].text}`, mode].filter(Boolean).join(', '), harness: /Agentic Systems/.test(r[1].text) ? model : undefined,
        params: size ? Number(size[1]) * (size[2] === 'T' ? 1000 : 1) : undefined,
        metrics: {...Object.fromEntries(r.slice(5).map((c, i) => [t[1][i + 5].text, num(c.text)]).filter((e): e is [string, number] => typeof e[1] === 'number')),
          ...(active ? {activeParams: Number(active[1])} : {})}};
    });
    if (rows.length < 3) throw new Error('LongShOT has fewer than three models');
    return rows;
  },
};
export default board;
