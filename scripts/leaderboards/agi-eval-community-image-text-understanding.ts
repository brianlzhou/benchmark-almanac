// AGI-Eval Community Image and Video Understanding ranks multimodal models on image-to-text accuracy.
// The importer reads the JSON ranking endpoint used by the public ranking page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://agi-eval.org/commWebApi/model/rank/dataList';
const board: Leaderboard = {
  benchmark: 'agi-eval-community-image-text-understanding',
  url: 'https://agi-eval.org/topRanking?modality=MULTIMODAL_MODEL&modelType=IMAGE_TEXT_UNDERSTANDING&rankType=PRIVATE',
  feed: FEED,
  terms: 'AGI-Eval publishes this ranking publicly. The site does not state separate score reuse terms.',
  parts: {
    imageToTextAccuracy: { name: 'Image to text objective accuracy', group: 'Project' },
    multiImageUnderstanding: { name: 'Multi-image understanding', group: 'Project' },
    characterRecognition: { name: 'Character information recognition', group: 'Project' },
    academicReasoning: { name: 'Academic reasoning', group: 'Project' },
    entityAttributeRecognition: { name: 'Entity attribute recognition', group: 'Project' },
    entityRecognition: { name: 'Entity recognition', group: 'Project' },
    perception: { name: 'Perception', group: 'Project' },
    reasoning: { name: 'Reasoning', group: 'Project' },
    overallAttributeRecognition: { name: 'Overall attribute recognition', group: 'Project' },
    knowledge: { name: 'Knowledge', group: 'Project' },
    generalReasoning: { name: 'General reasoning', group: 'Project' },
  },
  async fetch() {
    const rankMonth = `${new Date().getUTCFullYear()}/${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;
    const body = await fetchJson<any>(FEED, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ modality: 'MULTIMODAL_MODEL', modelType: 'IMAGE_TEXT_UNDERSTANDING', rankType: 'PRIVATE', rankMonth, limit: 100 }) });
    const list = body?.data?.modelRankList;
    if (!Array.isArray(list) || list.length < 90) throw new Error(`AGI-Eval image text: expected at least 90 models, got ${list?.length ?? 0}`);
    const names: Record<string, string> = { '图生文客观准确率': 'imageToTextAccuracy', '多图理解': 'multiImageUnderstanding', '字符信息识别': 'characterRecognition', '学科推理': 'academicReasoning', '实体属性识别': 'entityAttributeRecognition', '实体识别': 'entityRecognition', '感知': 'perception', '推理': 'reasoning', '整体属性识别': 'overallAttributeRecognition', '知识储备': 'knowledge', '通用推理': 'generalReasoning' };
    return list.map((entry: any) => {
      const projects = Array.isArray(entry.projectList) ? entry.projectList : [];
      const main = projects.find((p: any) => p.project === '图生文客观准确率');
      const score = Number(main?.score) * 100;
      if (!entry.name || !Number.isFinite(score)) throw new Error('AGI-Eval image text: ranking row missing score');
      const metrics: Record<string, number> = {};
      for (const p of projects) { const key = names[p.project]; const value = Number(p.score) * 100; if (key && Number.isFinite(value)) metrics[key] = value; }
      return { model: entry.name, score, date: entry.evalTime, metrics } satisfies LeaderboardRow;
    });
  },
};
export default board;
