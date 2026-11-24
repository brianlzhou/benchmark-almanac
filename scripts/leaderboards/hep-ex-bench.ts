// HEP-Ex-Bench: evaluates AI coding agents on four real experimental high-energy physics analysis tasks from CMS
// (HiggsLepMass, HiggsWidth, LepCalib, JetCalib) across P0, P1, and P2 guidance levels. Reads the inline JSON DATA
// payload from hep-ex-bench.github.io and reproduces the site's default pooled mean score across tasks and guidance.
// Headline spread definition quoted verbatim from the site script:
// "the bar of a score: ±1 standard error over runs, within each task and guidance level (n-1)" -> stored as metrics.stderr.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://hep-ex-bench.github.io/';

interface HepData {
  dict: { m: string[]; f: string[]; h: string[]; e: string[]; t: string[]; s: string[]; sub: (string | null)[] };
  tasks: {
    id: string;
    n: number;
    cols: { m: number[]; f: number[]; h: number[]; e: number[]; t: number[]; s: number[]; sub: number[]; p: (number | null)[]; c: (number | null)[]; w: (number | null)[]; k: (number | null)[] };
  }[];
}

interface Run {
  task: string;
  m: string;
  h: string;
  e: string;
  t: string;
  sub: string;
  p: number | null;
  c: number | null;
  w: number | null;
  k: number | null;
}

const TASK_KEYS: Record<string, string> = {
  HiggsLepMass: 'higgsLepMass',
  HiggsWidth: 'higgsWidth',
  LepCalib: 'lepCalib',
  JetCalib: 'jetCalib',
};

const valid = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);
const avg = (xs: (number | null | undefined)[]): number | undefined => {
  const a = xs.filter(valid);
  return a.length ? a.reduce((s, v) => s + v, 0) / a.length : undefined;
};

/** Exact site SE formula: ±1 standard error over runs, within each task and guidance level (n-1). */
function pooledSe(byTask: Run[][]): number | undefined {
  if (!byTask.length || byTask.every((a) => a.length < 2)) return undefined;
  let v = 0;
  const T = byTask.length;
  for (const a of byTask) {
    const lv = new Map<string, number[]>();
    for (const r of a) {
      if (!valid(r.p)) continue;
      const arr = lv.get(r.t) ?? [];
      arr.push(r.p);
      lv.set(r.t, arr);
    }
    const K = lv.size;
    if (!K) return undefined;
    for (const x of lv.values()) {
      if (x.length < 2) return undefined;
      const mu = x.reduce((q, y) => q + y, 0) / x.length;
      const s2 = x.reduce((q, y) => q + (y - mu) ** 2, 0) / (x.length - 1);
      v += s2 / x.length / (K * K) / (T * T);
    }
  }
  return Math.sqrt(v);
}

const board: Leaderboard = {
  benchmark: 'hep-ex-bench',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on GitHub Pages by the HEP-Ex-Bench authors with no robots.txt restrictions.',
  harnesses: 'system',
  parts: {
    higgsLepMass: { name: 'HiggsLepMass', group: 'Task', note: 'CMS Higgs boson mass and signal strength in the four-lepton channel.' },
    higgsWidth: { name: 'HiggsWidth', group: 'Task', note: 'CMS Higgs width ratio and on-shell signal strength.' },
    lepCalib: { name: 'LepCalib', group: 'Task', note: 'CMS electron and muon scale, resolution, and efficiency corrections.' },
    jetCalib: { name: 'JetCalib', group: 'Task', note: 'CMS jet energy scale and resolution corrections.' },
  },
  stats: {
    devTimeHours: { name: 'Development time', unit: 'hours', better: 'lower', note: 'Mean session wall-clock time in hours.' },
    totalTokens: { name: 'Total tokens', unit: 'tokens', better: 'lower', note: 'Mean total tokens per analysis session.' },
  },
  chart: {
    title: 'Score vs. session cost',
    note: 'Pooled score against mean session API cost in USD, matching the default scatter chart on HEP-Ex-Bench.',
    x: { key: 'cost', label: 'Session cost', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const m = html.match(/const DATA\s*=\s*(\{[\s\S]*?\});/);
    if (!m) throw new Error('HEP-Ex-Bench inline DATA payload not found');
    const data = JSON.parse(m[1]) as HepData;
    const runs: Run[] = [];
    for (const task of data.tasks) {
      const c = task.cols;
      const D = data.dict;
      for (let i = 0; i < task.n; i++) {
        const status = D.s[c.s[i]];
        const p = status === 'rule violation' ? 0 : c.p[i];
        runs.push({
          task: task.id,
          m: D.m[c.m[i]],
          h: D.h[c.h[i]],
          e: D.e[c.e[i]],
          t: D.t[c.t[i]],
          sub: D.sub[c.sub[i]] ?? 'HEP-Ex-Bench',
          p: valid(p) ? p : null,
          c: valid(c.c[i]) ? c.c[i] : null,
          w: valid(c.w[i]) ? c.w[i] : null,
          k: valid(c.k[i]) ? c.k[i] : null,
        });
      }
    }
    const groups = new Map<string, Run[]>();
    for (const r of runs) {
      const key = `${r.m}|${r.h}|${r.e}|${r.sub}`;
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }
    const taskIds = data.tasks.map((t) => t.id);
    const out: LeaderboardRow[] = [];
    for (const list of groups.values()) {
      const byTask = taskIds.map((tid) => list.filter((r) => r.task === tid && valid(r.p))).filter((a) => a.length > 0);
      if (!byTask.length) continue;
      const taskMeans = byTask.map((a) => avg(a.map((r) => r.p))!);
      const score = avg(taskMeans);
      if (!valid(score)) continue;
      const metrics: Record<string, number> = {};
      for (const a of byTask) {
        const key = TASK_KEYS[a[0].task];
        const tm = avg(a.map((r) => r.p));
        if (key && valid(tm)) metrics[key] = Number(tm.toFixed(2));
      }
      const se = pooledSe(byTask);
      if (valid(se)) metrics.stderr = Number(se.toFixed(2));
      const meanW = avg(list.map((r) => r.w));
      if (valid(meanW)) metrics.devTimeHours = Number((meanW / 3600).toFixed(2));
      const meanK = avg(list.map((r) => r.k));
      if (valid(meanK)) metrics.totalTokens = Math.round(meanK);
      const meanC = avg(list.map((r) => r.c));
      out.push({
        model: list[0].m,
        harness: list[0].h,
        setting: list[0].e ? `${list[0].e} effort` : undefined,
        score: Number(score.toFixed(2)),
        cost: valid(meanC) ? Number(meanC.toFixed(2)) : undefined,
        metrics,
      });
    }
    if (out.length < 10) throw new Error(`HEP-Ex-Bench returned only ${out.length} rows`);
    return out;
  },
};
export default board;
