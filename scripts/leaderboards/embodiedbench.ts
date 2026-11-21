// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// EmbodiedBench measures success on embodied tasks. The official board publishes an average and capability scores for each environment.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://embodiedbench.github.io/';
const environments = [
  ['alfred', 'eb_alfred', 'EB-ALFRED'], ['habitat', 'eb_habitat', 'EB-Habitat'],
  ['navigation', 'eb_nav', 'EB-Navigation'], ['manipulation', 'eb_mani', 'EB-Manipulation'],
];
const capabilities: Record<string, string> = { base: 'Base', common: 'Common', complex: 'Complex', visual: 'Visual', spatial: 'Spatial', long: 'Long horizon' };
const board: Leaderboard = {
  benchmark: 'embodiedbench', url, feed: url + 'website/data/eb_alfred_total_benchmark.json',
  terms: 'The authors publish the board at https://embodiedbench.github.io/ and give attribution in the benchmark repository.',
  headline: 'The headline averages the four environment success rates reported by the leaderboard.',
  parts: Object.fromEntries([
    ['EB-ALFRED','EB-ALFRED'],['eb_alfred_base','EB-ALFRED: Base'],['eb_alfred_common','EB-ALFRED: Common'],['eb_alfred_complex','EB-ALFRED: Complex'],['eb_alfred_visual','EB-ALFRED: Visual'],['eb_alfred_spatial','EB-ALFRED: Spatial'],['eb_alfred_long','EB-ALFRED: Long horizon'],
    ['EB-Habitat','EB-Habitat'],['eb_habitat_base','EB-Habitat: Base'],['eb_habitat_common','EB-Habitat: Common'],['eb_habitat_complex','EB-Habitat: Complex'],['eb_habitat_visual','EB-Habitat: Visual'],['eb_habitat_spatial','EB-Habitat: Spatial'],['eb_habitat_long','EB-Habitat: Long horizon'],
    ['EB-Navigation','EB-Navigation'],['eb_nav_base','EB-Navigation: Base'],['eb_nav_common','EB-Navigation: Common'],['eb_nav_complex','EB-Navigation: Complex'],['eb_nav_visual','EB-Navigation: Visual'],['eb_nav_long','EB-Navigation: Long horizon'],
    ['EB-Manipulation','EB-Manipulation'],['eb_mani_base','EB-Manipulation: Base'],['eb_mani_common','EB-Manipulation: Common'],['eb_mani_complex','EB-Manipulation: Complex'],['eb_mani_visual','EB-Manipulation: Visual'],['eb_mani_spatial','EB-Manipulation: Spatial'],['eb_mani_long','EB-Manipulation: Long horizon'],
  ].map(([key,name]) => [key, { name, unit: '%' }])),
  aliases: {
    'GPT-4o-mini (snapshot unspecified)': 'gpt-4o-mini', 'Gemini-2.0-flash': 'gemini-2-0-flash-dec-2024',
    'Claude-3.5-Sonnet (snapshot unspecified)': 'claude-3-5-sonnet-october-2024',
    'Llama-3.2-90B-Vision-Ins': 'llama-3-2-90b', 'Llama-3.2-11B-Vision-Ins': 'llama-3-2-11b',
    'Qwen2-VL-72B-Ins': 'qwen2-vl-72b-instruct', 'Qwen2-VL-7B-Ins': 'qwen2-vl-7b-instruct',
    'Qwen2.5-VL-72B-Ins': 'qwen2-5-vl-72b', 'Qwen2.5-VL-7B-Ins': 'qwen2-5-vl-7b',
  },
  async fetch() {
    const models = new Map<string, Record<string, number>>();
    for (const [file, prefix, name] of environments) {
      if (models.size) await new Promise(resolve => setTimeout(resolve, 1050));
      const data = await fetchJson<Record<string, unknown>[]>(url + 'website/data/eb_' + file + '_total_benchmark.json');
      if (!Array.isArray(data) || !data.length) throw new Error('Missing ' + name + ' results');
      board.parts![name] = name;
      for (const entry of data) {
        if (typeof entry.model !== 'string' || !(prefix + '_avg' in entry)) throw new Error('Missing model or average');
        const model = entry.model.replace('GPT-4o mini', 'GPT-4o-mini');
        const metrics = models.get(model) ?? {};
        if (name in metrics) throw new Error('Duplicate ' + name + ' result');
        for (const [sourceKey, v] of Object.entries(entry)) {
          if (!sourceKey.startsWith(prefix + '_') || v === '-') continue;
          if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('Invalid ' + sourceKey);
          const key = sourceKey.slice(prefix.length + 1);
          if (key === 'avg') metrics[name] = v;
          else if (capabilities[key]) {
            metrics[sourceKey] = v;
            board.parts![sourceKey] = { name: name + ': ' + capabilities[key], group: name };
          }
        }
        models.set(model, metrics);
      }
    }
    const rows = [...models].filter(([, m]) => environments.every(([, , name]) => name in m))
      .map(([model, metrics]) => ({ model, metrics, score: environments.reduce((sum, [, , name]) => sum + metrics[name], 0) / 4 }));
    return checked(rows, 24);
  },
};
export default board;
