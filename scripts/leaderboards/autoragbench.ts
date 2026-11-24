// AutoRAGBench (Tsinghua University and Sina Weibo): coding agents build retrieval-augmented generation systems from
// scratch under a six-hour single-H800 budget across nine tasks, evaluated by five held-out answering models.
// assets/data.js embeds window.AUTORAG with per-task, per-reader scores, per-task retrieval latency (s/query), and
// total 9-build API cost (USD). The headline matches assets/common.js U.macro(scores, 'avg') * 100. Figure B on the
// homepage draws the score versus mean retrieval latency Pareto frontier.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const SITE = 'https://zhanghang9991.github.io/AutoRAGBench_Website/';
const FEED = `${SITE}assets/data.js`;

interface AutoRagAgent {
  key: string;
  model: string;
  harness: string;
  cost: number;
  scores: Record<string, Record<string, number>>;
  latency: Record<string, number>;
}

interface AutoRagPayload {
  benchmarks: { key: string; name: string }[];
  agents: AutoRagAgent[];
}

const TASK_KEYS: Record<string, { key: string; name: string }> = {
  nq_open: { key: 'nq', name: 'NQ' },
  hotpotqa: { key: 'hotpotqa', name: 'HotpotQA' },
  musique: { key: 'musique', name: 'MuSiQue' },
  multihop_rag: { key: 'multihopRag', name: 'MH-RAG' },
  pubmedqa: { key: 'pubmedqa', name: 'PubMedQA' },
  qasper: { key: 'qasper', name: 'QASPER' },
  fever: { key: 'fever', name: 'FEVER' },
  webqsp: { key: 'webqsp', name: 'WebQSP' },
  cwq: { key: 'cwq', name: 'CWQ' },
};

const HARNESS_MAP: Record<string, string> = {
  'Codex CLI': 'Codex',
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round = (x: number) => Math.round(x * 100) / 100;

const board: Leaderboard = {
  benchmark: 'autoragbench',
  url: SITE,
  feed: FEED,
  terms: 'The authors publish the AutoRAGBench leaderboard and static assets/data.js on GitHub Pages with no robots.txt restrictions.',
  harnesses: 'system',
  costPer: 'run',
  parts: Object.fromEntries(Object.values(TASK_KEYS).map(({ key, name }) => [key, { name, group: 'Task' }])),
  stats: {
    latency: {
      name: 'Mean retrieval latency',
      unit: 'seconds',
      better: 'lower',
      note: 'Mean retrieval latency per hidden test question across the nine tasks, including generator calls.',
    },
  },
  chart: {
    title: 'Score vs retrieval latency',
    x: { key: 'latency', label: 'Mean retrieval latency', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Average score', unit: '%', better: 'higher' },
    note: 'Average score across the nine tasks plotted against mean retrieval latency per question, redrawn from Figure B.',
  },
  async fetch() {
    const js = await fetchText(FEED);
    const data = jsonAfter<AutoRagPayload>(js, 'window.AUTORAG =');
    if (!Array.isArray(data.agents) || data.agents.length < 5) {
      throw new Error(`AutoRAGBench data.js changed: only ${data.agents?.length ?? 0} agents`);
    }
    const benchKeys = Object.keys(TASK_KEYS);
    const out: LeaderboardRow[] = data.agents.map((a) => {
      const metrics: Record<string, number> = {};
      const taskMeans: number[] = [];
      const latVals: number[] = [];
      for (const bk of benchKeys) {
        const readerMap = a.scores?.[bk];
        if (!readerMap) throw new Error(`AutoRAGBench missing task ${bk} for ${a.model}`);
        const vals = Object.values(readerMap);
        if (vals.length !== 5 || vals.some((v) => !Number.isFinite(v))) {
          throw new Error(`AutoRAGBench invalid reader scores on ${bk} for ${a.model}`);
        }
        const tm = mean(vals);
        taskMeans.push(tm);
        metrics[TASK_KEYS[bk].key] = round(tm * 100);
        const lat = a.latency?.[bk];
        if (!Number.isFinite(lat)) throw new Error(`AutoRAGBench missing latency on ${bk} for ${a.model}`);
        latVals.push(lat);
      }
      metrics.latency = round(mean(latVals));
      return {
        model: a.model,
        harness: HARNESS_MAP[a.harness] ?? a.harness,
        score: round(mean(taskMeans) * 100),
        ...(Number.isFinite(a.cost) && a.cost > 0 ? { cost: a.cost } : {}),
        metrics,
      };
    });
    return out;
  },
};

export default board;
