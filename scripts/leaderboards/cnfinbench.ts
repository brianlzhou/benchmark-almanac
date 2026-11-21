// CNFinBench publishes overall financial evaluation scores for its LLM and agent settings.
// The ranking API returns dated results, token totals and dimension scores for each setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://cnfinbench.opencompass.org.cn/api/v1/base/evaluation/list/v2";

const board: Leaderboard = {
  benchmark: "cnfinbench",
  url: "https://cnfinbench.opencompass.org.cn/home",
  feed,
  terms: "The publisher links the board at https://cnfinbench.opencompass.org.cn/home. Separate results licensing remains unverified. The site serves the app shell at robots.txt.",
  aliases: { 'doubao-seed-2-1-pro-260628': 'doubao-seed-2-1-pro' },
  parts: {
    "finProKnowledgeDim": "金融专业知识问答",
    "finBasicsDim": "Fin_Basics\n（Accuracy）",
    "finCertExamsDim": "Fin_Cert_Exams\n（Accuracy）",
    "finBusinessAnalysisDim": "金融业务理解与分析",
    "finInfoExtractDim": "Fin_Info_Extract\n（Micro-F1）",
    "finReportParseDim": "Fin_Report_Parse\n（Accuracy）",
    "finReasonConsistencyDim": "Fin_Reason_Consistency\n（Agent-as-a-Judge）",
    "finReasonInsightDim": "Fin_Reason_Insight\n（Agent-as-a-Judge）",
    "finFactualReasoningCalcuDim": "金融事实推理与计算",
    "creditScoreDim": "Credit_Score\n（Accuracy）",
    "quantInvestDim": "Quant_Invest\n（Accuracy）",
    "loanAnalysisDim": "Loan_Analysis\n（Accuracy）",
    "bankAccountFraudDetectDim": "BankAccount_Fraud_Detect\n（Accuracy）",
    "finNumCalcDim": "Fin_Num_Calc\n（Accuracy）",
    "finReasonAlignDim": "Fin_Reason_Align\n（Evidence-binding F1）",
    "finComplianceRiskCtrlDim": "金融合规与风险控制",
    "finComplianceDim": "Fin_Compliance\n（Accuracy）",
    "finRiskCtrlDim": "Fin_Risk_Ctrl\n（Accuracy）",
    "finInternalAppSecDim": "金融内生与应用安全",
    "finInternalSecDim": "Fin_Internal_Sec\n（Agent-as-a-Judge）",
    "finAppSecDim": "Fin_App_Sec\n（Agent-as-a-Judge）"
},
  async fetch() {
    type Entry = { modelName: string; ownerName: string; evaluationAt: string; sourceType: number; parametersScale: string;
      completionTokens: string; scores: Record<string,string> };
    type Page = { code: number; data: { pageData: { count: number; page: number }; tableHeader: {column: string; columnName: string}[]; list: Entry[] } };
    const rows: LeaderboardRow[] = [];
    for (const genre of [1,2]) {
      let count = 0;
      for (let page = 1; ; page++) {
        if (rows.length) await new Promise(resolve => setTimeout(resolve, 1000));
        const result = await fetchJson<Page>(feed, { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ genre, page, pageSize: 100 }) });
        const { pageData, tableHeader, list } = result.data;
        if (result.code !== 0 || pageData.page !== page || !list.length || !tableHeader.some(c => c.column === 'overallScore'))
          throw new Error('Missing CNFinBench page');
        for (const c of tableHeader) if (c.column.endsWith('Dim')) board.parts![c.column] = c.columnName;
        for (const entry of list) {
          const { overallScore, ...scores } = entry.scores;
          if (!entry.modelName || !overallScore || !Number.isFinite(Number(overallScore))) throw new Error('Missing CNFinBench overall score');
          const metrics: Record<string, number> = {};
          for (const [key, value] of Object.entries(scores)) {
            if (value === '-' || value === 'N/A') continue;
            if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid dimension score: ' + key);
            metrics[key] = Number(value);
          }
          const tokens = entry.completionTokens?.match(/^([\d.]+)([KM]?)$/i);
          if (tokens) metrics.totalCompletionTokens = Number(tokens[1]) * ({ K: 1000, M: 1000000 }[tokens[2] as 'K'|'M'] ?? 1);
          const size = entry.parametersScale?.match(/^([\d.]+)([BT])$/);
          rows.push({ model: entry.modelName, submitter: entry.ownerName, setting: genre === 1 ? 'LLM' : 'Agent',
            date: entry.evaluationAt, open: entry.sourceType === 1, params: size ? +size[1] * (size[2] === 'T' ? 1000 : 1) : undefined,
            score: Number(overallScore), metrics });
        }
        count += list.length;
        if (count >= pageData.count) {
          if (count !== pageData.count || count < (genre === 1 ? 11 : 6)) throw new Error('CNFinBench row count changed');
          break;
        }
      }
    }
    return rows;
  },
};

export default board;
