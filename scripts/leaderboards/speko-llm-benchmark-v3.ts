// Speko scores task completion across its 19 voice-agent scenarios.
// Its public JSON gives partial-credit task scores, bootstrap intervals and the hosting provider.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://speko.com/benchmarks/data.json";
type Entry = { model: string; measured: string; provider: string; cells: Record<string, { s?: number; ci?: string }> };

const board: Leaderboard = {
  benchmark: "speko-llm-benchmark-v3",
  url: "https://speko.com/benchmarks/llm",
  feed,
  terms: "Speko publishes its benchmark JSON under CC BY 4.0. Credit Speko and identify changes. robots.txt allows the feed path.",
  stats: {
    stall: { name: 'Stall rate', unit: '%', better: 'lower' }, fabric: { name: 'Fabrication rate', unit: '%', better: 'lower' },
    deadair: { name: 'Dead-air rate', unit: '%', better: 'lower' }, toolsilence: { name: 'Tool silence rate', unit: '%', better: 'lower' },
    refusal: { name: 'Refusal rate', unit: '%', better: 'lower' }, toolarg: { name: 'Tool argument error rate', unit: '%', better: 'lower' },
    placeholder: { name: 'Placeholder rate', unit: '%', better: 'lower' }, ttft: { name: 'Time to first token', unit: 'ms', better: 'lower' },
    cost: { name: 'Cost per million tokens', unit: 'usd-per-mtok', better: 'lower' }, consistency: { name: 'Consistency', unit: '%', better: 'higher' },
    realcall: { name: 'Real-call success rate', unit: '%', better: 'higher' }, leak: { name: 'Information leak rate', unit: '%', better: 'lower' },
    'realcall:scheduling': { name: 'Scheduling success rate', unit: '%', better: 'higher' }, 'realcall:orders': { name: 'Orders success rate', unit: '%', better: 'higher' },
    'realcall:intake': { name: 'Intake success rate', unit: '%', better: 'higher' }, 'realcall:payments': { name: 'Payments success rate', unit: '%', better: 'higher' },
    'realcall:frontdesk': { name: 'Front-desk success rate', unit: '%', better: 'higher' },
  },
  chart: {
    title: 'Task completion vs time to first token',
    x: { key: 'ttft', label: 'TTFT p50', unit: 'ms', better: 'lower' },
    y: { key: 'score', label: 'Task done', unit: '%', better: 'higher' },
    note: 'Task completion against median time to first token across voice agent calls.',
  },
  async fetch() {
    const data = await fetchJson<{ boards: { id: string; rows: Entry[] }[] }>(feed);
    const rows = data.boards.find(b => b.id === 'llm')?.rows.filter(r => Number.isFinite(r.cells.task?.s));
    if (!rows || rows.length < 30) throw new Error('Missing voice-agent task scores');
    return rows.map(r => {
      const task = r.cells.task;
      const ci = task.ci?.match(/([\d.]+)[–-]([\d.]+)%/);
      const n = task.ci?.match(/n=(\d+)/);
      const metrics = Object.fromEntries(Object.entries(r.cells).filter(([k,v]) => k !== 'score' && k !== 'task' && Number.isFinite(v.s)).map(([k,v]) => [k,v.s!]));
      return { model: r.model, setting: r.provider, score: task.s!, date: r.measured,
        low: ci ? Number(ci[1]) : undefined, high: ci ? Number(ci[2]) : undefined, trials: n ? Number(n[1]) : undefined, metrics };
    });
  },
};
export default board;
