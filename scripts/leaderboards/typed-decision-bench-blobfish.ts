// Typed Decision Bench grades probabilistic decisions against known labels. Blobfish's run export reports DecisionScore overall and for each suite.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://blobfish.ai/benchmark-reports/typed-decision-bench-runs.json";

const board: Leaderboard = {
  benchmark: "typed-decision-bench-blobfish",
  url: "https://blobfish.ai/leaderboard/typed-decision-bench",
  feed,
  terms: "The benchmark page links the source and gives no blanket license for results. https://blobfish.ai/leaderboard robots.txt allows the report path.",
  parts: {
    'data-and-operations': { name: 'Data and operations', group: 'Suite' },
    'real-time-and-agents': { name: 'Real-time and agents', group: 'Suite' },
    'retrieval-and-knowledge': { name: 'Retrieval and knowledge', group: 'Suite' },
    'safety-and-quality': { name: 'Safety and quality', group: 'Suite' },
    'workflow-control': { name: 'Workflow control', group: 'Suite' },
  },
  stats: {
    answered: { name: 'Answered items', unit: 'count' }, skipped: { name: 'Skipped items', unit: 'count' }, truncated: { name: 'Truncated items', unit: 'count' }, correct: { name: 'Correct decisions', unit: 'count' },
    accuracy: { name: 'Accuracy', unit: 'score', better: 'higher', note: 'Accuracy from 0 to 1.' },
  },
  async fetch() {
    type Scores = Record<string, number | string | null> & {decisionScore:number};
    type Run = {system:{name:string,model:string,licence?:string}, harness:string, finishedAt:string, aggregate:Scores, suites:Record<string,Scores>, provenanceHref?:string};
    const d = await fetchJson<{benchmark:{id:string,suites:string[]},runs:Run[]}>(feed);
    if (d.benchmark.id !== 'typed-decision-bench' || d.runs.length < 6 || d.benchmark.suites.length < 5) throw new Error('Incomplete typed decision runs');
    return d.runs.map(r => {
      const metrics: Record<string,number> = {};
      for (const [k,v] of Object.entries(r.aggregate)) if (k !== 'items' && k !== 'decisionScore' && typeof v === 'number') metrics[k] = v;
      for (const k of d.benchmark.suites) {
        if (!Number.isFinite(r.suites[k]?.decisionScore)) throw new Error('Missing suite ' + k);
        metrics[k] = r.suites[k].decisionScore;
      }
      if (!r.system.model || !Number.isFinite(r.aggregate.decisionScore)) throw new Error('Missing model or score');
      return {model:r.system.model, score:r.aggregate.decisionScore, harness:r.harness, date:r.finishedAt?.slice(0,10),
        license:r.system.licence, link:r.provenanceHref ? new URL(r.provenanceHref,feed).href : undefined, metrics};
    });
  },
};

export default board;
