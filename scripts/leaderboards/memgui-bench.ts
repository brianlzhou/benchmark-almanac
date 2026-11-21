// MemGUI-Bench ranks Android agents by average first-attempt success. Its site loads each configuration from the agent index and displays cross-app and difficulty scores.
// The project defines p@3 as best-of-three success (pass@3).
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://memgui-bench.github.io/data/index.json";
interface Entry { name: string; backbone: string; type: string; date: string; institution: string; codeLink?: string; paperLink?: string;
  avg: { p1: number; p3?: number }; difficulty: Record<string,Record<string,number|null>>; crossApp: Record<string,Record<string,number|null>>; metrics: Record<string,Record<string,number|null>> }

const board: Leaderboard = {
  benchmark: "memgui-bench",
  url: "https://memgui-bench.github.io/",
  feed: FEED,
  terms: "The index lists 22 end-to-end agents and seven workflows. Some rows include cost per step. The benchmark repository uses MIT. Separate leaderboard terms were not stated. https://github.com/lgy0404/MemGUI-Bench/blob/master/LICENSE The robots URL returns HTML.",
  harnesses: 'system',
  stats: {
    passAt3: { name: 'Pass@3', unit: '%', better: 'higher' },
    easy_p3: { name: 'Easy pass@3', unit: '%', better: 'higher' }, easy_irr: { name: 'Easy interaction success', unit: '%', better: 'higher' }, medium_p3: { name: 'Medium pass@3', unit: '%', better: 'higher' }, medium_irr: { name: 'Medium interaction success', unit: '%', better: 'higher' }, hard_p3: { name: 'Hard pass@3', unit: '%', better: 'higher' }, hard_irr: { name: 'Hard interaction success', unit: '%', better: 'higher' },
    app1_p3: { name: 'App 1 pass@3', unit: '%', better: 'higher' }, app1_irr: { name: 'App 1 interaction success', unit: '%', better: 'higher' }, app2_p3: { name: 'App 2 pass@3', unit: '%', better: 'higher' }, app2_irr: { name: 'App 2 interaction success', unit: '%', better: 'higher' }, app3_p3: { name: 'App 3 pass@3', unit: '%', better: 'higher' }, app3_irr: { name: 'App 3 interaction success', unit: '%', better: 'higher' }, app4_p3: { name: 'App 4 pass@3', unit: '%', better: 'higher' }, app4_irr: { name: 'App 4 interaction success', unit: '%', better: 'higher' },
    shortTerm_irr: { name: 'Short-term interaction success', unit: '%', better: 'higher' }, shortTerm_mtpr: { name: 'Short-term mean task progress rate', unit: 'score', better: 'higher' }, shortTerm_timePerStep: { name: 'Short-term time per step', unit: 'seconds', better: 'lower' }, longTerm_frr: { name: 'Long-term failure recovery rate', unit: '%', better: 'higher' }, longTerm_timePerStep: { name: 'Long-term time per step', unit: 'seconds', better: 'lower' }, shortTerm_stepRatio: { name: 'Short-term step ratio', unit: 'score', better: 'lower' }, shortTerm_costPerStep: { name: 'Short-term cost per step', unit: 'usd', better: 'lower' }, longTerm_stepRatio: { name: 'Long-term step ratio', unit: 'score', better: 'lower' }, longTerm_costPerStep: { name: 'Long-term cost per step', unit: 'usd', better: 'lower' },
  },
  async fetch() {
    const index = await fetchJson<{agents:string[]}>(FEED);
    if (index.agents.length < 29) throw new Error('Expected 29 MemGUI systems');
    const parts: Record<string,string> = {};
    const rows = [];
    for (const id of index.agents) {
      await new Promise(resolve => setTimeout(resolve,1000));
      const r = await fetchJson<Entry>(new URL('agents/' + encodeURIComponent(id) + '.json',FEED).href);
      if (!r.name || !Number.isFinite(r.avg?.p1)) throw new Error('Missing first-attempt success for ' + id);
      const metrics: Record<string,number> = {};
      if (r.avg.p3 != null) metrics.passAt3 = r.avg.p3;
      for (const [group, scores] of Object.entries({...r.difficulty,...r.crossApp,...r.metrics})) {
        for (const [metric, value] of Object.entries(scores ?? {})) if (typeof value === 'number') {
          const key = group + '_' + metric; metrics[key] = value;
          if (metric === 'p1') parts[key] = group;
        }
      }
      const agent = r.type === 'Agentic Workflow' && r.backbone && r.backbone !== '-';
      rows.push({ model: agent ? r.backbone : r.name, harness: agent ? r.name : undefined, agentOrg: r.institution,
        score: r.avg.p1, date: r.date, link: r.paperLink?.startsWith('https:') ? r.paperLink : undefined, metrics });
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
