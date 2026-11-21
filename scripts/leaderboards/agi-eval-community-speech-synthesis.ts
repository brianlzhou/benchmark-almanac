// AGI-Eval Community Speech Synthesis ranks speech models by human-likeness.
// The importer reads the JSON ranking endpoint used by the public ranking page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://agi-eval.org/commWebApi/model/rank/dataList';
const board: Leaderboard = {
  benchmark: 'agi-eval-community-speech-synthesis',
  url: 'https://agi-eval.org/topRanking?modality=MULTIMODAL_MODEL&modelType=SPEECH_SYNTHESIS&rankType=PRIVATE',
  feed: FEED,
  terms: 'AGI-Eval publishes this ranking publicly. The site does not state separate score reuse terms.',
  async fetch() {
    const rankMonth = `${new Date().getUTCFullYear()}/${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;
    const body = await fetchJson<any>(FEED, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ modality: 'MULTIMODAL_MODEL', modelType: 'SPEECH_SYNTHESIS', rankType: 'PRIVATE', rankMonth, limit: 100 }) });
    const list = body?.data?.modelRankList;
    if (!Array.isArray(list) || list.length < 5) throw new Error(`AGI-Eval speech synthesis: expected 5 models, got ${list?.length ?? 0}`);
    return list.map((entry: any) => {
      const score = Number(entry.projectList?.find((p: any) => p.project === '拟人度')?.score) * 100;
      if (!entry.name || !Number.isFinite(score)) throw new Error('AGI-Eval speech synthesis: ranking row missing score');
      return { model: entry.name, score, date: entry.evalTime } satisfies LeaderboardRow;
    });
  },
};
export default board;
