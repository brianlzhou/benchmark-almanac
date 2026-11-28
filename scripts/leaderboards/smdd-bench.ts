// SMDD-Bench (CMU, 502 small-molecule drug-design tasks). smddbench.com is a Next.js page whose results ship
// as a module in one of its script chunks (runs:[{run_id:...}]); chunk names change on each deploy, so the
// importer fetches the page's chunks and reads the one that holds the runs, as data, never run. The main
// board is the full 502-task runs: per run the model id, display name (with reasoning effort),
// overall_rate (tasks whose molecule passes every criterion, 0 to 1, the score as 0 to 100) and
// cost_per_task, plus avg_runtime_seconds (the table's "Avg time/task", kept as metrics.latency). A 200-task
// diversity study in the same chunk is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import {jsLiteral} from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://smddbench.com/';
const TASKS = 502;

const board: Leaderboard = {
  benchmark: 'smdd-bench',
  url: PAGE,
  feed: `${PAGE}_next/static/chunks/*.js (runs module, ${TASKS}-task runs)`,
  terms: 'Data shipped in the public smddbench.com page bundle; robots.txt allows it (content signals: search yes, AI training no) and the site states no terms.',
  aliases: {
    'kimi-k2.5': 'kimi-k2-5',
  },
  parts: {
    '2dPharmacophoreIdentification': { name: '2D Pharmacophore Identification', group: 'Task type' },
    interactionPointDiscovery: { name: 'Interaction Point Discovery', group: 'Task type' },
    scaffoldHopping: { name: 'Scaffold Hopping', group: 'Task type' },
    leadOptimization: { name: 'Lead Optimization', group: 'Task type' },
    fragmentAssembly: { name: 'Fragment Assembly', group: 'Task type' },
  },
  stats: {
    latency: { name: 'Average time per task', unit: 'seconds', better: 'lower' },
    tasks_passed: { name: 'Tasks passed', unit: 'count' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"?]+\.js/g)].map((m) => m[0]))];
    let source = '';
    for (const c of chunks) {
      const js = await fetchText(new URL(c, PAGE).href).catch(() => '');
      if (js.includes('runs:[{run_id:')) {
        source = js;
        break;
      }
    }
    if (!source) throw new Error('no runs module in the SMDD-Bench chunks');
    const rows: LeaderboardRow[] = [];
    const types = [...source.matchAll(/\bid:"(\d+)",title:"([^"]+)"/g)];
    for(const m of source.matchAll(/runs:(\[\{run_id:)/g)){
      const part=source.slice(m.index!+5).replace(/:\.(\d)/g,':0.$1').replace(/([{,])(\d+):/g,'$1"$2":');
      for(const r of jsLiteral<any[]>(part,0)){
        if(r.tasks_total !== TASKS) continue;
        const model=r.model_id.split('/').at(-1).replace(/-preview$/i,'');const effort=r.display_name.match(/_(minimal|low|medium|high|xhigh|max)_/)?.[1]??(/-thinking_/.test(r.display_name)?'thinking':undefined);
        const metrics:Record<string,number>={latency:r.avg_runtime_seconds};for(const k of ['avg_successful','avg_unique_successful','avg_pct_novel_successful','avg_pairwise_tanimoto'])if(typeof r[k]==='number')metrics[k]=r[k];
        for (const [, id, name] of types) {
          const rate = r.by_type?.[id]?.rate;
          if (typeof rate !== 'number') continue;
          const key = name.toLowerCase().replace(/[^a-z0-9]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '');
          metrics[key] = rate * 100;
        }
        if (typeof r.tasks_passed === 'number') metrics.tasks_passed = r.tasks_passed;
        const harness = r.display_name.endsWith('_minimalist_agent') ? 'Minimalist Agent' : undefined;
        rows.push({model,score:r.overall_rate*100,setting:effort,harness,date:r.timestamp?.slice(0,10),cost:r.cost_per_task,metrics});
      }
    }
    return rows;
  },
};
export default board;
