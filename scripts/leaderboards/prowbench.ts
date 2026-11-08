// PROWBench: use the board's default Verified-FF view and its Overall score (0–100).
// leaderboard-core.js defines: "Category = mean of its normalized submetrics; Overall = equal-weight mean
// of categories in this setting." Reproduce that published formula, requiring every metric, without rounding.
// Other scene sets are not alternative configurations of this default view. Raw submetrics remain in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://alaya-lab.github.io/PROWBench/assets/leaderboard-data.js";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "prowbench",
  url: "https://alaya-lab.github.io/PROWBench/assets/leaderboard-data.js?v=008053f95466",
  feed: FEED,
  terms: "Public results published by the benchmark authors at alaya-lab.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const d=jsonAfter<any>(await fetchText(FEED),'const data =');const out:LeaderboardRow[]=[];
    const split = d.splits.find((s: any) => s.id === 'verified');
    if (!split) throw new Error('PROWBench default Verified-FF view missing');
    const normalize = (key: string, value: number): number => {
      if (!Number.isFinite(value) || (key !== 'clip' && value < 0)) return NaN;
      let v = value;
      if (['iou','isr','lra','gisr','glra','aes','smooth','re_iou','re_state'].includes(key)) v *= 100;
      else if (['cerr','trans','cammc'].includes(key)) v = 100 / (1 + v);
      else if (key === 'rot') v = 100 / (1 + Math.PI * v / 180);
      else if (key === 'miss') v = 100 * (1 - v);
      else if (key === 'met3r') v = 100 * (1 - v / 2);
      else if (key === 'warp') v = 100 * (1 - Math.sqrt(v / 1000));
      return Math.min(100, Math.max(0, v));
    };
    for (const r of split.rows) {
      const groups = new Map<string, number[]>();
      for (const k of split.metric_ids) {
        const group = d.metrics[k].group;
        groups.set(group, [...(groups.get(group) ?? []), normalize(k, r.metrics[k])]);
      }
      const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
      const score = mean([...groups.values()].map(mean));
      if (!Number.isFinite(score)) continue;
      out.push({model: identity(r.model_name), score,
        setting: ['inputs ' + r.inputs.join('+'), d.models[r.model_id]?.configuration].filter(Boolean).join('; '),
        metrics: {...r.metrics, cases: split.cases}});
    }if(!out.length)throw new Error('PROWBench manuscript rows missing');return out;
  },
};
export default board;
