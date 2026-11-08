// Monthly-SWEBench (UniPat AI with xbench). unipat.ai/benchmarks/MonthlySWEBench is server-rendered and
// carries its data inline as `var SWE_DATA = {...}`: per category (Overall, Bug Fix, Non-Bug Fix) and
// monthly snapshot ("2026-06"), per model the pass@1 over that month's ~100 tasks, the agent and turn counts.
// Each month is a new task set. Keep only the latest Overall month; category scores are metrics. pass@1 (0 to 100) is the score and the agent (OpenHands, Terminus-2) the
// harness. Unranked rows without a pass@1 are skipped. Names carry the effort ("GPT-5.5-High"), which the
// resolver splits off. avgTurns (OpenHands iterations per task, the page's Avg Turns) is kept as metrics.turns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const URL = 'https://unipat.ai/benchmarks/MonthlySWEBench';

interface Data {
  data: Record<string, { snapshots: Record<string, { modelName: string; passAt1?: number; agent?: string; avgTurns?: number | null; avgEp?: number | null }[]> }>;
}

const board: Leaderboard = {
  benchmark: 'monthly-swebench',
  url: URL,
  feed: `${URL} (inline SWE_DATA, newest Overall snapshot)`,
  terms: 'Server-rendered page on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  aliases: {
    'Hunyuan-HY3-Preview': 'tencent-hy3-preview',
    'Doubao-Seed-2.1-Pro': 'seed-2-1-pro',
    'Doubao-Seed-2.0-Pro': 'seed-2-0-pro',
  },
  async fetch() {
    const html = await fetchText(URL);
    const at = html.indexOf('var SWE_DATA = ');
    if (at < 0) throw new Error('SWE_DATA not found on the Monthly-SWEBench page');
    const data = jsLiteral<Data>(html, at + 'var SWE_DATA = '.length);
    const rows: LeaderboardRow[] = [];
    const latest = Object.keys(data.data.Overall.snapshots).filter(m => /^\d{4}-\d\d$/.test(m)).sort().at(-1);
    for (const [category, dataSet] of Object.entries(data.data)) {
      if (category !== 'Overall') continue;
      for (const [month, entries] of Object.entries(dataSet.snapshots)) {
        if (month !== latest) continue;
        for (const r of entries) {
          if (typeof r.passAt1 !== 'number') continue;
          const effort=r.modelName.match(/-(High|XHigh|Max|Adaptive|Thinking)$/i);
          const turns=r.avgTurns ?? r.avgEp;
          const metrics:Record<string,number> = typeof turns==='number'?{turns}:{};
          for(const [name, group] of Object.entries(data.data)){if(name==='Overall')continue;const sub=group.snapshots[month]?.find(x=>x.modelName===r.modelName&&x.agent===r.agent);if(typeof sub?.passAt1==='number')metrics[name.toLowerCase().replace(/[^a-z]+/g,'_')]=sub.passAt1;}
          rows.push({model:effort?r.modelName.slice(0,effort.index):r.modelName,score:r.passAt1,harness:r.agent,setting:[month,effort?.[1].toLowerCase()].filter(Boolean).join('; '),metrics});
        }
      }
    }
    return rows;
  },
};
export default board;
