// AGI-Eval Community Text to Video ranks video generators by composite accuracy.
// The importer reads the JSON ranking endpoint used by the public ranking page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://agi-eval.org/commWebApi/model/rank/dataList';
const board: Leaderboard = {
  benchmark: 'agi-eval-community-text-to-video',
  url: 'https://agi-eval.org/topRanking?modality=MULTIMODAL_MODEL&modelType=TEXT_TO_VIDEO&rankType=PRIVATE',
  feed: FEED,
  terms: 'AGI-Eval publishes this ranking publicly. The site does not state separate score reuse terms.',
  parts: {
    subjectiveAccuracy: { name: 'Subjective accuracy', group: 'Project' },
    objectiveAccuracy: { name: 'Objective accuracy', group: 'Project' },
  },
  async fetch() {
    const rankMonth = `${new Date().getUTCFullYear()}/${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;
    const body = await fetchJson<any>(FEED, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ modality: 'MULTIMODAL_MODEL', modelType: 'TEXT_TO_VIDEO', rankType: 'PRIVATE', rankMonth, limit: 100 }) });
    const list = body?.data?.modelRankList;
    if (!Array.isArray(list) || list.length < 30) throw new Error(`AGI-Eval text to video: expected 30 models, got ${list?.length ?? 0}`);
    return list.map((entry: any) => {
      const projects = entry.projectList ?? [];
      const score = Number(projects.find((p: any) => p.project === '综合准确率')?.score) * 100;
      if (!entry.name || !Number.isFinite(score)) throw new Error('AGI-Eval text to video: ranking row missing score');
      const metrics: Record<string, number> = {};
      for (const [source, key] of [['主观准确率', 'subjectiveAccuracy'], ['客观准确率', 'objectiveAccuracy']] as const) { const value = Number(projects.find((p: any) => p.project === source)?.score) * 100; if (Number.isFinite(value)) metrics[key] = value; }
      return { model: entry.name, score, date: entry.evalTime, ...(entry.openStatus !== undefined ? { open: entry.openStatus === 1 } : {}), metrics } satisfies LeaderboardRow;
    });
  },
};
export default board;
