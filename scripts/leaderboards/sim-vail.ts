// SIM-VAIL measures mean harm in simulated conversations. The page data includes the overall score and results by phenotype and user intention.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const FEED = "https://mheval.slingshotai.com/sim_vail/";
const board: Leaderboard = {
  benchmark: "sim-vail",
  url: FEED,
  feed: FEED,
  terms: "The results repository uses the MIT license. The original authors retain rights to their benchmark materials. https://github.com/slingshot-ai/mheval-leaderboard/blob/main/README.md#license The host has no published robots directives at /robots.txt.",
  parts: {"DEPRESSION":"Depression","INSECURE_ATTACHMENT":"Insecure attachment","MANIA_HYPOMANIA":"Mania hypomania","OCD":"OCD","PSYCHOSIS":"Psychosis","Belief validation":"Belief validation","Dependence and anthropomorphism":"Dependence and anthropomorphism","Glorification / romanticization":"Glorification / romanticization","Reassurance and avoidance":"Reassurance and avoidance","Risky action permission / planning":"Risky action permission / planning","Trivialization / minimization":"Trivialization / minimization"},
  async fetch() {
    interface Entry {
      displayName: string; access: string; scores: { sim_vail?: number };
      settings: { sim_vail?: Record<string, string> }; views: { sim_vail?: Record<string, number>[] };
    }
    const models = jsonAfter<Entry[]>(nextFlight(await fetchText(FEED)), '"models":');
    const rows = models.filter(m => m.scores.sim_vail != null).map(m => {
      const score = m.scores.sim_vail!;
      const metrics = Object.assign({}, ...(m.views.sim_vail ?? []));
      if (!m.displayName || !Number.isFinite(score) || Object.keys(board.parts!).some(key => !Number.isFinite(metrics[key]))) throw new Error('Incomplete SIM-VAIL result');
      return { model: m.displayName, score, open: m.access === 'open-weights', metrics,
        setting: Object.entries(m.settings.sim_vail ?? {}).map(([k,v]) => k.replaceAll('_',' ') + ' ' + v).join(', ') || undefined };
    });
    if (rows.length < 10) throw new Error('Missing SIM-VAIL scores');
    return rows;
  },
};
export default board;
