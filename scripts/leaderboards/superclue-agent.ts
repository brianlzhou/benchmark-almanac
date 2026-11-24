// SuperCLUE-Agent (CLUE team) on superclueai.com. The specific-board page loads /data/agent_list/Agent/<round>.xlsx;
// the rounds come from the folder-to-rounds map in the app's visualization-utils chunk (Agent:["2024年10月",...],
// newest first). The score is 总分 (total score) on the Agent总榜 sheet of the newest round; 发布日期 is passed as
// the run date. The XLSX reader is shared with superclue.ts.
import type { Leaderboard } from './types.ts';
import { SC_ALIASES, SC_SITE, SC_TERMS, scChunk, scRows } from './superclue.ts';

/** Newest round of a specific board folder, from the app's folder map. */
export async function scRound(folder: string): Promise<string> {
  const js = await scChunk('visualization-utils-');
  const m = js.match(new RegExp(`[,{]"?${folder}"?:\\["([^"]+)"`));
  if (!m) throw new Error(`no rounds for ${folder}`);
  return m[1];
}

const board: Leaderboard = {
  benchmark: 'superclue-agent',
  parts: {
    taskPlanning: { name: 'Task planning', group: 'Pillar' },
    toolUse: { name: 'Tool use', group: 'Pillar' },
    memory: { name: 'Short and long term memory', group: 'Pillar' },
    taskDecomp: { name: 'Task decomposition', group: 'Capability' },
    cot: { name: 'Chain of thought', group: 'Capability' },
    selfReflection: { name: 'Self-reflection', group: 'Capability' },
    apiRetrieval: { name: 'API retrieval', group: 'Capability' },
    apiPlanning: { name: 'API planning', group: 'Capability' },
    apiCalling: { name: 'API calling', group: 'Capability' },
    generalTools: { name: 'General tool use', group: 'Capability' },
    multiDocQa: { name: 'Multi-document QA', group: 'Capability' },
    longDialog: { name: 'Long-range dialogue', group: 'Capability' },
    fewShot: { name: 'Few-shot learning', group: 'Capability' },
  },
  url: `${SC_SITE}/specificpage`,
  feed: `${SC_SITE}/data/agent_list/Agent/<round>.xlsx (Agent总榜 sheet, 总分)`,
  terms: SC_TERMS,
  aliases: SC_ALIASES,
  fetch: async () => scRows(`/data/agent_list/Agent/${await scRound('Agent')}.xlsx`, 'Agent总榜', '模型', {
    parts: {
      taskPlanning: '任务规划',
      toolUse: '工具使用',
      memory: '长短期记忆',
    },
    detail: {
      sheet: '十大基础能力',
      modelCol: '模型名称',
      parts: {
        taskDecomp: '任务分解',
        cot: '思维链',
        selfReflection: '自我反思',
        apiRetrieval: '检索API',
        apiPlanning: '规划API',
        apiCalling: '调用API',
        generalTools: '通用工具使用',
        multiDocQa: '多文档问答',
        longDialog: '长程对话',
        fewShot: '少样本示例学习',
      },
    },
  }),
};
export default board;
