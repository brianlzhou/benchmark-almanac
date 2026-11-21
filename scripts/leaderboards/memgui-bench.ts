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
