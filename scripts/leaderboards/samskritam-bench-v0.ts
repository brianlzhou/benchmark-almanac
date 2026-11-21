// Samskritam-Bench v0 measures accuracy on 487 Sanskrit questions. The publisher’s leaderboard JSON contains the overall fraction and five named task scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://www.samskritam.ai/data/leaderboard.json";
const parts = { analyze:'Analysis', gita:'Gītā', meter:'Chandas', subanta:'Subanta', tinanta:'Tiṅanta' };

const board: Leaderboard = {
  benchmark: "samskritam-bench-v0",
  url: "https://www.samskritam.ai/bench#results",
  feed: FEED,
  terms: "The maker licenses results under CC BY 4.0 and requests credit for Samskritam.ai, the Digital Corpus of Sanskrit, and Vidyut. https://www.samskritam.ai/bench#v0 The robots URL returns 404.",
  parts,
  async fetch() {
    const d = await fetchJson<{benchmark:string;items:number;rows:{model:string;overall:number;tasks:Record<string,number>}[]}>(FEED);
    if (d.benchmark !== 'samskritam-bench v0' || d.items !== 487 || d.rows.length < 6) throw new Error('Wrong Sanskrit benchmark release');
    return d.rows.map(r => {
      if (!r.model || !Number.isFinite(r.overall) || !Object.keys(parts).every(k => Number.isFinite(r.tasks[k]))) throw new Error('Invalid Sanskrit result');
      const off = r.model.endsWith(' (reasoning off)');
      return { model: r.model.replace(/ \(reasoning off\)$/, ''), setting:off ? 'Reasoning off' : undefined, score:100*r.overall,
        metrics:Object.fromEntries(Object.keys(parts).map(k => [k,100*r.tasks[k]])) };
    });
  },
};
export default board;
