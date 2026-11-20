// VBench-2.0: read the live Gradio dataframe identified by its five intrinsic-faithfulness categories.
// Total Score is already a percentage. Keep all category and dimension scores as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const FEED = 'https://vchitect-vbench-leaderboard.hf.space/config';
const board: Leaderboard = {
  benchmark: 'vbench-2-0', parts: {
  'Creativity Score': { name: 'Creativity', group: 'Dimension' },
  'Commonsense Score': { name: 'Commonsense', group: 'Dimension' },
  'Controllability Score': { name: 'Controllability', group: 'Dimension' },
  'Human Fidelity Score': { name: 'Human fidelity', group: 'Dimension' },
  'Physics Score': { name: 'Physics', group: 'Dimension' },
  'Human Anatomy': { name: 'Human anatomy', group: 'Dimension' },
  'Human Clothes': { name: 'Human clothes', group: 'Dimension' },
  'Human Identity': { name: 'Human identity', group: 'Dimension' },
  Composition: { name: 'Composition', group: 'Dimension' },
  Diversity: { name: 'Diversity', group: 'Dimension' },
  Mechanics: { name: 'Mechanics', group: 'Dimension' },
  Material: { name: 'Material', group: 'Dimension' },
  Thermotics: { name: 'Thermotics', group: 'Dimension' },
  'Multi-View Consistency': { name: 'Multiview consistency', group: 'Dimension' },
  'Dynamic Spatial Relationship': { name: 'Dynamic spatial relationship', group: 'Dimension' },
  'Dynamic Attribute': { name: 'Dynamic attribute', group: 'Dimension' },
  'Motion Order Understanding': { name: 'Motion order understanding', group: 'Dimension' },
  'Human Interaction': { name: 'Human interaction', group: 'Dimension' },
  'Complex Landscape': { name: 'Complex landscape', group: 'Dimension' },
  'Complex Plot': { name: 'Complex plot', group: 'Dimension' },
  'Camera Motion': { name: 'Camera motion', group: 'Dimension' },
  'Motion Rationality': { name: 'Motion rationality', group: 'Dimension' },
  'Instance Preservation': { name: 'Instance preservation', group: 'Dimension' },
}, url: 'https://huggingface.co/spaces/Vchitect/VBench_Leaderboard', feed: FEED,
  terms: 'Vchitect publishes these results through its public Hugging Face Space. Benchmark Almanac credits and links the source.',
  async fetch() {
    const d = await fetchJson<{components: {type:string; props:{value?:{headers:string[]; data:unknown[][]}}}[]}>(FEED);
    const t = d.components.find(c => c.type === 'dataframe' && c.props.value?.headers.includes('Human Fidelity Score'))?.props.value;
    if (!t) throw new Error('VBench-2.0 dataframe missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.data) {
      const score = num(String(r[t.headers.indexOf('Total Score')]));
      const model = String(r[0]).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      if (score === undefined || !model) continue;
      const metrics: Record<string, number> = {};
      t.headers.forEach((h,i) => { const value = i > 6 ? num(String(r[i] ?? '')) : undefined; if (value !== undefined) metrics[h] = value; });
      const date = String(r[t.headers.indexOf('Date')]);
      rows.push({model, score, date: /^\d{4}-\d\d-\d\d$/.test(date) ? date : undefined, metrics});
    }
    if (!rows.length) throw new Error('VBench-2.0 scores missing');
    return rows;
  },
};
export default board;
