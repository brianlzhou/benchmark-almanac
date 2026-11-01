// SMDD-Bench (CMU, 502 small-molecule drug-design tasks). smddbench.com is a Next.js page whose results ship
// as a module in one of its script chunks (runs:[{run_id:...}]); chunk names change on each deploy, so the
// importer fetches the page's chunks and reads the one that holds the runs, as data, never run. The main
// board is the full 502-task runs: per run the model id, display name (with reasoning effort),
// overall_rate (tasks whose molecule passes every criterion, 0 to 1, the score as 0 to 100) and
// cost_per_task. A 200-task diversity study in the same chunk is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
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
    const record = /display_name:"([^"]+)",model_id:"([^"]+)",tasks_total:(\d+),tasks_passed:\d+,overall_rate:([\d.e-]+)[\s\S]*?cost_per_task:([\d.e-]+)/g;
    for (const m of source.matchAll(record)) {
      const [, display, modelId, total, rate, cost] = m;
      if (Number(total) !== TASKS) continue;
      // "azure_ai/claude-sonnet-4-6", "together_ai/Qwen/Qwen3.5-397B-A17B": the last path part is the model
      const model = modelId.split('/').at(-1)!.replace(/-preview$/i, '');
      const effort = display.match(/_(minimal|low|medium|high|xhigh|max)_/)?.[1];
      const thinking = /-thinking_/.test(display) ? 'thinking' : undefined;
      rows.push({ model, score: Number(rate) * 100, setting: effort ?? thinking, cost: Number(cost) });
    }
    return rows;
  },
};
export default board;
