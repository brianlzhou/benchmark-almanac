// MVBench's official Hugging Face Space publishes its current dataframe in Gradio's /config response.
// The backing submission CSV requires authentication, but this public response contains the same visible
// leaderboard. Its public dimension filter supplies the task scores. Avg is accuracy in percent across the twenty temporal tasks. Random is not a model.
// Backbone names distinguish submissions with identical display names; they never replace the video model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
const FEED = 'https://opengvlab-mvbench-leaderboard.hf.space/config';
const clean = (s: unknown) => String(s ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
type Table = { headers: string[]; data: unknown[][] };
const board: Leaderboard = {
  benchmark: 'mvbench',
  url: 'https://huggingface.co/spaces/OpenGVLab/MVBench_Leaderboard',
  feed: FEED,
  terms: 'The authors publish this public Hugging Face Space; upstream terms apply and the Almanac credits and links the source.',
  async fetch() {
    const config = await fetchJson<{ components: { type: string; props: { value?: Table; choices?: string[][] } }[] }>(FEED);
    let table = config.components.find(c => c.type === 'dataframe' && c.props.value?.headers.includes('Avg'))?.props.value;
    if (!table) throw new Error('MVBench dataframe missing');
    const choices = config.components.find(c => c.type === 'checkboxgroup' && c.props.choices?.some(([name]) => name === 'Avg'))?.props.choices;
    if (choices) {
      // Select all dimensions through the same read-only filter as the public page.
      const call = new URL('/call/on_filter_model_size_method_change', FEED).href;
      const request = await fetchJson<{ event_id: string }>(call, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: [choices.map(([, value]) => value)] }),
      });
      const events = await fetchText(call + '/' + encodeURIComponent(request.event_id));
      const data = events.match(/event: complete\r?\ndata: ([^\n]+)/)?.[1];
      if (data) {
        const expanded = JSON.parse(data.replace(/([,[]\s*)NaN(?=\s*[,\]])/g, '$1null'))[0]?.value as Table;
        if (expanded?.data && expanded.headers.includes('Avg')) table = expanded;
      }
    }
    board.parts = Object.fromEntries((choices ?? []).filter(([name]) => name !== 'Avg').map(([name]) => [name, name]));
    const modelCol = table.headers.indexOf('Model'), scoreCol = table.headers.indexOf('Avg'), backboneCol = table.headers.indexOf('Language Model');
    if (modelCol < 0 || scoreCol < 0) throw new Error('MVBench columns changed');
    const names = table.data.map(r => clean(r[modelCol]));
    const rows: LeaderboardRow[] = [];
    for (const r of table.data) {
      let model = clean(r[modelCol]);
      const score = r[scoreCol];
      if (!model || /^random$/i.test(model) || typeof score !== 'number' || !Number.isFinite(score)) continue;
      if (names.filter(n => n === model).length > 1 && r[backboneCol]) model += ` (${clean(r[backboneCol])})`;
      if (/^(GPT-4V|GeminiPro)$/i.test(model)) model += ' (snapshot unspecified)';
      const metrics: Record<string, number> = {};
      for (let j = scoreCol + 1; j < table.headers.length; j++) if (typeof r[j] === 'number') metrics[table.headers[j]] = r[j] as number;
      rows.push({ model, score, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    if (!rows.length) throw new Error('MVBench has no model results');
    return rows;
  },
};
export default board;
