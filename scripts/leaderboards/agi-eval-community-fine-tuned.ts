// AGI-Eval Community Instruction-Tuned Language Models ranks fine-tuned language models by objective accuracy.
// The headline is the board's overall objective evaluation accuracy, with skill and language scores in metrics.
// This importer reads the AGI-Eval ranking API for the current month selected by the public leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://agi-eval.org/topRanking?modality=LARGE_LANGUAGE_MODEL&modelType=FINE_TUNED&rankType=PRIVATE';
const FEED = 'https://agi-eval.org/commWebApi/model/rank/dataList';
const MODEL_TYPE = 'FINE_TUNED';
const RANK_TYPE = 'PRIVATE';
const MODALITY = 'LARGE_LANGUAGE_MODEL';
const MONTHS = 'https://agi-eval.org/commWebApi/model/rank/listDate';
const parts = {
  algorithmReasoning: { name: 'Algorithm reasoning', group: 'Skill' },
  codeReasoningChinese: { name: 'Code reasoning Chinese', group: 'Skill' },
  cognition: { name: 'Cognition', group: 'Skill' },
  cognitionChinese: { name: 'Cognition Chinese', group: 'Skill' },
  cognitionEnglish: { name: 'Cognition English', group: 'Skill' },
  generalReasoning: { name: 'General reasoning', group: 'Skill' },
  generalReasoningChinese: { name: 'General reasoning Chinese', group: 'Skill' },
  generalReasoningEnglish: { name: 'General reasoning English', group: 'Skill' },
  interaction: { name: 'Interaction', group: 'Skill' },
  interactionChinese: { name: 'Interaction Chinese', group: 'Skill' },
  interactionEnglish: { name: 'Interaction English', group: 'Skill' },
  learning: { name: 'Learning', group: 'Skill' },
  learningChinese: { name: 'Learning Chinese', group: 'Skill' },
  learningEnglish: { name: 'Learning English', group: 'Skill' },
  mathReasoning: { name: 'Math reasoning', group: 'Skill' },
  mathReasoningChinese: { name: 'Math reasoning Chinese', group: 'Skill' },
  subjectKnowledge: { name: 'Subject knowledge', group: 'Skill' },
  subjectKnowledgeChinese: { name: 'Subject knowledge Chinese', group: 'Skill' },
  instructionFollowing: { name: 'Instruction following', group: 'Skill' },
  instructionFollowingChinese: { name: 'Instruction following Chinese', group: 'Skill' },
  subjectReasoning: { name: 'Subject reasoning', group: 'Skill' },
  subjectReasoningChinese: { name: 'Subject reasoning Chinese', group: 'Skill' },
  subjectReasoningEnglish: { name: 'Subject reasoning English', group: 'Skill' },
  chinese: { name: 'Chinese', group: 'Language' },
  english: { name: 'English', group: 'Language' },
};
const projectKeys: Record<string, string> = {
  '算法推理': 'algorithmReasoning',
  '代码推理_中': 'codeReasoningChinese',
  '认知能力': 'cognition',
  '认知能力_中': 'cognitionChinese',
  '认知能力_英': 'cognitionEnglish',
  '通用推理': 'generalReasoning',
  '通用推理_中': 'generalReasoningChinese',
  '通用推理_英': 'generalReasoningEnglish',
  '交互能力': 'interaction',
  '交互能力_中': 'interactionChinese',
  '交互能力_英': 'interactionEnglish',
  '学习能力': 'learning',
  '学习能力_中': 'learningChinese',
  '学习能力_英': 'learningEnglish',
  '数学推理': 'mathReasoning',
  '数学推理_中': 'mathReasoningChinese',
  '学科知识': 'subjectKnowledge',
  '学科知识_中': 'subjectKnowledgeChinese',
  '指令遵循': 'instructionFollowing',
  '指令遵循_中': 'instructionFollowingChinese',
  '学科推理': 'subjectReasoning',
  '学科推理_中': 'subjectReasoningChinese',
  '学科推理_英': 'subjectReasoningEnglish',
  '客观评测准确率_中': 'chinese',
  '客观评测准确率_英': 'english',
};
interface RankDateResponse { rescode: number; data?: { rankDateList?: string[] }; msg?: string }
interface RankResponse { rescode: number; data?: { modelRankList?: Array<{ name?: string; evalTime?: string; openStatus?: number; projectList?: Array<{ project?: string; score?: string }> }> }; msg?: string }

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
    return { model: source.name, score, date: source.evalTime, ...(source.openStatus !== undefined ? { open: source.openStatus === 1 } : {}), metrics };
  });
}

const board: Leaderboard = {
  benchmark: 'agi-eval-community-fine-tuned',
  url: PAGE,
  feed: `${FEED} (POST with the current month, FINE_TUNED, PRIVATE, and objective accuracy sort)`,
  terms: 'AGI-Eval publishes the ranking API and page. The site gives no separate score reuse license. Results are credited to AGI-Eval (Meituan).',
  parts,
  async fetch() { return fetchAgiEvalRows(MODEL_TYPE); },
};
export default board;
