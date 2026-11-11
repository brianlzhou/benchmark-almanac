// RoboLab (NVIDIA) on research.nvidia.com. The leaderboard page is static HTML whose first table ranks
// policies on the 120 Isaac Lab tasks: # | Policy | Type | N | SR% | Score | motion metrics. Success rate
// (SR%, 0 to 100) is the headline. Policies include agentic LM harnesses and VLA or world models, and only those
// in the registry match. The table's Score (partial-credit task score, 0 to 100) and EE Speed (end-effector
// speed, cm/s) are kept in metrics as "taskScore" and "eeSpeed". The latency cells do not line up with their
// headers in some versions; read them only when row/header lengths match.
// Complexity and instruction-specificity success rates are metrics on the whole-benchmark row.
import type { Leaderboard } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://research.nvidia.com/labs/srl/projects/robolab/leaderboard.html';

const board: Leaderboard = {
  benchmark: 'robolab',
  url: URL,
  feed: `${URL} (leaderboard table, SR%)`,
  terms: 'Static public page; robots.txt allows it with a search=yes, ai-input=yes content signal, and the page states no further terms.',
  aliases: {},
  async fetch() {
    const rows = await tableRows(URL, { model: /^Policy$/i, score: /^SR%$/i, harness: /^Type$/i, metrics: { taskScore: /^Score$/i, eeSpeed: /^EE Speed$/i } });
    const all = tables(await fetchText(URL));
    for (const table of all) {
      if (table[0]?.[1]?.text === 'Policy') {
        const h = table[0].map(c=>c.text);
        for (const r of table.slice(1)) {
          const row=rows.find(x=>x.model===r[1]?.text);
          if(!row || r.length!==h.length)continue;
          for (const [key,re] of [['latency',/^Action-generation latency/],['replanningDelay',/^Replanning delay/]] as const) {
            const index=h.findIndex(x=>re.test(x));const n=index>=0?num(r[index]?.text):undefined;
            if(n!==undefined)row.metrics={...row.metrics,[key]:n/1000};
          }
        }
      }
      if(table[1]?.[1]?.text!=='Policy')continue;
      const labels=table[0].slice(2).map(c=>c.text);
      for(const r of table.slice(2)) {
        const original=rows.find(x=>x.model===r[1]?.text&&!x.setting);if(!original)continue;
        for(let j=0;j<labels.length;j++){
          const score=num(r[4+4*j]?.text), taskScore=num(r[5+4*j]?.text);if(score===undefined)continue;
          const key=labels[j].toLowerCase().replace(/[^a-z0-9]+/g,"_");
          original.metrics={...original.metrics,[key]:score,...(taskScore===undefined?{}:{[key+"_score"]:taskScore})};
        }
      }
    }
    // The official JSON also exposes vague/specific instructions, absent from the static default table.
    interface Result { sr: number; score?: number; ee_speed_cm_s?: number; episodes?: number; sr_ci_cp?: number[]; by_difficulty?: Record<string, Result>; by_axis?: Record<string, Result> }
    const data = await fetchJson<{entries: {display_name: string; results: Record<string, Result>}[]}>('https://research.nvidia.com/labs/srl/projects/robolab/static/data/leaderboard.json');
    for (const entry of data.entries) {
      const original = rows.find(r => r.model === entry.display_name);
      if (!original) continue;
      for (const [variant, r] of Object.entries(entry.results)) {
        if (!Number.isFinite(r.sr)) continue;
        const metrics: Record<string, number> = variant === 'default' ? {...original.metrics} : {};
        for (const [key, n] of Object.entries({taskScore:r.score, eeSpeed:r.ee_speed_cm_s, episodes:r.episodes, ciLow:r.sr_ci_cp?.[0], ciHigh:r.sr_ci_cp?.[1]})) if (Number.isFinite(n)) metrics[key] = n!;
        for (const [key, value] of Object.entries({...r.by_difficulty, ...r.by_axis})) {
          if (Number.isFinite(value.sr)) metrics[key] = value.sr;
          if (Number.isFinite(value.score)) metrics[key+'_score'] = value.score!;
        }
        if (variant === 'default') original.metrics = metrics;
        else rows.push({model: original.model, harness: original.harness, setting: `${variant} instructions`, score:r.sr, metrics});
      }
    }
    return rows;
  },
};
export default board;
