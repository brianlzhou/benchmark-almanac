// VenusBench-Mobile ranks mobile GUI agents by total success rate. The results JSON includes task scores, stability tests, diagnostic scores and token measurements.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://ui-venus.github.io/VenusBench-Mobile-Leaderboard/results/venusbench-mobile.json";

const board: Leaderboard = {
  benchmark: "venusbench-mobile",
  url: "https://ui-venus.github.io/VenusBench-Mobile-Leaderboard/",
  feed,
  terms: "The 11 configurations include two planners sharing an executor and two uses of GUI-Owl-7B. The cost tab reports token counts only. Score reuse terms were not stated. https://ui-venus.github.io/VenusBench-Mobile-Leaderboard/ GitHub Pages returns 404 for robots.txt.",
  harnesses: 'system',
  stats: {
    original: { name: 'Original stability', unit: '%', better: 'higher' },
    chinese: { name: 'Chinese stability', unit: '%', better: 'higher' },
    variation: { name: 'Variation stability', unit: '%', better: 'higher' },
    dark: { name: 'Dark stability', unit: '%', better: 'higher' },
    pad: { name: 'Pad stability', unit: '%', better: 'higher' },
    min: { name: 'Min stability', unit: '%', better: 'higher' },
    max: { name: 'Max stability', unit: '%', better: 'higher' },
    spr: { name: 'Stability pass rate', unit: '%', better: 'higher', note: 'A base task passes only when all corresponding environment settings pass.' },
    p_l12: { name: 'Perception level 1 to 2', unit: '%', better: 'higher' },
    p_l34: { name: 'Perception level 3 to 4', unit: '%', better: 'higher' },
    u_l12: { name: 'Understanding level 1 to 2', unit: '%', better: 'higher' },
    u_l34: { name: 'Understanding level 3 to 4', unit: '%', better: 'higher' },
    d_l12: { name: 'Decision level 1 to 2', unit: '%', better: 'higher' },
    d_l34: { name: 'Decision level 3 to 4', unit: '%', better: 'higher' },
    a_l12: { name: 'Action level 1 to 2', unit: '%', better: 'higher' },
    a_l34: { name: 'Action level 3 to 4', unit: '%', better: 'higher' },
    m_l12: { name: 'Memory level 1 to 2', unit: '%', better: 'higher' },
    m_l34: { name: 'Memory level 3 to 4', unit: '%', better: 'higher' },
    tt_k: { name: 'Total output tokens', unit: 'thousands' },
    pt: { name: 'Average per-step output tokens', unit: 'tokens' },
  },
  async fetch() {
    type Run = {name:string,type:string,setup:string,link:string,scores:Record<string,number>,stability?:Record<string,number>,cost?:Record<string,number>,diagnostics?:Record<string,number>};
    const d = await fetchJson<{metadata:{primaryMetric:string,taskColumns:{key:string,label:string,description:string}[]},models:Run[]}>(feed);
    if (d.metadata.primaryMetric !== 'total' || d.models.length < 11 || d.metadata.taskColumns.length < 9) throw new Error('Missing mobile GUI results');
    board.parts = Object.fromEntries(d.metadata.taskColumns.map(c => [c.key,{name:c.label,note:c.description}]));
    return d.models.map(r => {
      if (!r.name || !Number.isFinite(r.scores.total)) throw new Error('Missing agent total');
      const models = r.name.split(' + ');
      const framework = r.name.match(/^(.+) \((.+)\)$/);
      const metrics = {...r.stability, ...r.diagnostics, ...r.cost};
      for (const col of d.metadata.taskColumns) {
        const value = r.scores[col.key];
        if (!(col.key in r.scores)) throw new Error('Missing ' + col.key);
        if (Number.isFinite(value)) metrics[col.key] = value;
      }
      return { model:framework?.[2] ?? models[0], models:models.length > 1 ? models : undefined,
        harness:framework?.[1], setting:r.setup, open:r.type === 'Open-source', score:r.scores.total, link:r.link || undefined, metrics };
    });
  },
};

export default board;
