// SuperCLUE-RAG (CLUE team) on superclueai.com. The specific-board page loads /data/specialized_list/RAG/<round>.xlsx
// (one round, "2024年11月-2025年4月", per the app's folder map). The score is 总分 (total score) on the
// SuperCLUE-RAG检索增强生成-总榜 (overall) sheet; 发布日期 is passed as the run date. Several entries are
// consumer apps (通义千问2.5, 文心一言 web) rather than API models. The XLSX reader is shared with superclue.ts.
import type { Leaderboard } from './types.ts';
import { SC_ALIASES, SC_SITE, SC_TERMS, scRows } from './superclue.ts';
import { scRound } from './superclue-agent.ts';

const board: Leaderboard = {
  benchmark: 'superclue-rag',
  parts: {
    refusal: { name: 'Refusal capability', group: 'Task' },
    errorCorrection: { name: 'Error detection and correction', group: 'Task' },
    infoIntegration: { name: 'Information integration', group: 'Task' },
    timeliness: { name: 'Answer timeliness', group: 'Task' },
  },
  url: `${SC_SITE}/specificpage`,
  feed: `${SC_SITE}/data/specialized_list/RAG/<round>.xlsx (总榜 sheet, 总分)`,
  terms: SC_TERMS,
  aliases: SC_ALIASES,
  fetch: async () => scRows(`/data/specialized_list/RAG/${await scRound('RAG')}.xlsx`, 'SuperCLUE-RAG检索增强生成-总榜', '模型名称', {
    detail: {
      sheet: 'SuperCLUE-RAG检索增强生成-四大任务',
      modelCol: '模型名称',
      parts: {
        refusal: '拒答能力',
        errorCorrection: '检错和纠错能力',
        infoIntegration: '信息整合能力',
        timeliness: '答案及时性',
      },
    },
  }),
};
export default board;
