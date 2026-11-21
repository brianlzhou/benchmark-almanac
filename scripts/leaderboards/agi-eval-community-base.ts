// AGI-Eval Community Base Language Models ranks base language models by objective accuracy.
// The headline is the board's overall objective evaluation accuracy, with skill and language scores in metrics.
// This importer reads the AGI-Eval ranking API for the current month selected by the public leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://agi-eval.org/topRanking?modality=LARGE_LANGUAGE_MODEL&modelType=BASE&rankType=PRIVATE';
const FEED = 'https://agi-eval.org/commWebApi/model/rank/dataList';
const MODEL_TYPE = 'BASE';
const RANK_TYPE = 'PRIVATE';
const MODALITY = 'LARGE_LANGUAGE_MODEL';
const MONTHS = 'https://agi-eval.org/commWebApi/model/rank/listDate';
const parts = {
  codeReasoning: { name: 'Code reasoning', group: 'Skill' },
  cognition: { name: 'Cognition', group: 'Skill' },
  generalReasoning: { name: 'General reasoning', group: 'Skill' },
  interaction: { name: 'Interaction', group: 'Skill' },
  learning: { name: 'Learning', group: 'Skill' },
  mathReasoning: { name: 'Math reasoning', group: 'Skill' },
  subjectKnowledge: { name: 'Subject knowledge', group: 'Skill' },
  chinese: { name: 'Chinese', group: 'Language' },
  english: { name: 'English', group: 'Language' },
};
const projectKeys: Record<string, string> = {
  '代码推理': 'codeReasoning',
  '认知能力': 'cognition',
  '通用推理': 'generalReasoning',
  '交互能力': 'interaction',
  '学习能力': 'learning',
  '数学推理': 'mathReasoning',
  '学科知识': 'subjectKnowledge',
  '客观评测准确率_中': 'chinese',
  '客观评测准确率_英': 'english',
};
interface RankDateResponse { rescode: number; data?: { rankDateList?: string[] }; msg?: string }
interface RankResponse { rescode: number; data?: { modelRankList?: Array<{ name?: string; evalTime?: string; projectList?: Array<{ project?: string; score?: string }> }> }; msg?: string }

export async function fetchAgiEvalRows(modelType: string): Promise<LeaderboardRow[]> {
  const dates = await fetchJson<RankDateResponse>(MONTHS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modality: MODALITY, modelType, rankType: RANK_TYPE }),
  });
  const rankMonth = dates.data?.rankDateList?.[0];
  if (dates.rescode !== 0 || !rankMonth) throw new Error(`AGI-Eval ${modelType}: ranking month missing`);
  const result = await fetchJson<RankResponse>(FEED, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modality: MODALITY, modelType, rankType: RANK_TYPE, rankMonth, limit: 500, sortProject: '客观评测准确率', sortOrder: 'asc' }),
  });
  const sourceRows = result.data?.modelRankList ?? [];
  if (result.rescode !== 0 || !sourceRows.length) throw new Error(`AGI-Eval ${modelType}: no ranking rows`);
  return sourceRows.map((source) => {
    if (!source.name || !source.projectList?.length) throw new Error(`AGI-Eval ${modelType}: row missing name or scores`);
    const values = new Map(source.projectList.map((p) => [p.project, Number(p.score)]));
    const score = values.get('客观评测准确率');
    if (score === undefined || !Number.isFinite(score)) throw new Error(`AGI-Eval ${modelType}: ${source.name} missing headline score`);
    const metrics: Record<string, number> = {};
    for (const [project, key] of Object.entries(projectKeys)) {
      const value = values.get(project);
      if (value !== undefined && Number.isFinite(value)) metrics[key] = value;
    }
    if (Object.keys(metrics).length < Object.keys(parts).length) throw new Error(`AGI-Eval ${modelType}: ${source.name} missing part scores`);
    return { model: source.name, score, date: source.evalTime, metrics };
  });
}

const board: Leaderboard = {
  benchmark: 'agi-eval-community-base',
  url: PAGE,
  feed: `${FEED} (POST with the current month, BASE, PRIVATE, and objective accuracy sort)`,
  terms: 'AGI-Eval publishes the ranking API and page. The site gives no separate score reuse license. Results are credited to AGI-Eval (Meituan).',
  parts,
  async fetch() { return fetchAgiEvalRows(MODEL_TYPE); },
};
export default board;
