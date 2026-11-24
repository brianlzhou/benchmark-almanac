// MedBench 4.0 (OpenCompass) evaluates LLMs, multimodal models and clinical agents on Chinese medical tasks.
// This importer reads the live MedBench v4 historical leaderboard API across all three tracks, using the
// official LLM overall score (0 to 100) as the headline and keeping all five LLM capability dimensions,
// all 36 LLM subtasks, and matched multimodal and agent overall scores in parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const API = 'https://medbench.opencompass.org.cn/api/v1/base/evaluation/list/v4';

interface Entry {
  modelName?: string;
  ownerName?: string;
  parametersScale?: string;
  sourceType?: number;
  releasedAt?: string;
  evaluationAt?: string;
  scores?: Record<string, string | number | null>;
}

interface ApiResp {
  code?: number;
  data?: {
    pageData?: { count?: number };
    list?: Entry[];
  };
}

const LLM_DIMS: Record<string, string> = {
  medKnowledgeDim: 'Medical knowledge QA',
  medLangGenDim: 'Medical language generation',
  medComplexInferDim: 'Complex medical reasoning',
  medSeeDim: 'Medical language understanding',
  medSafetyEthicsDim: 'Medical safety and ethics',
};

const KNOWLEDGE_TASKS: Record<string, string> = {
  medExamDim: 'MedExam',
  medHcDim: 'MedHC',
  medMcDim: 'MedMC',
  medSpeQaDim: 'MedSpeQA',
  medHgDim: 'MedHG',
  medLitQaDim: 'MedLitQA',
  medRehabDim: 'MedRehab',
  medRxPlanDim: 'MedRxPlan',
  medPsychCareDim: 'MedPsychCare',
  medPsychQaDim: 'MedPsychQA',
};

const LANGGEN_TASKS: Record<string, string> = {
  medRecordGenDim: 'MedRecordGen',
  medPopularDim: 'MedPopular',
  medSummaryDim: 'MedSummary',
  medExplainDim: 'MedExplain',
  medTeachDim: 'MedTeach',
};

const INFER_TASKS: Record<string, string> = {
  cmbClinExtendedDim: 'CMB-Clin-extended',
  ddxAdvancedDim: 'DDx-advanced',
  medTreatDim: 'MedTreat',
  medOutcomeDim: 'MedOutcome',
  medAnalysisDim: 'MedAnalysis',
  medDiagDim: 'MedDiag',
  medDifferDim: 'MedDiffer',
  medCareDim: 'MedCare',
  medPrimaryDim: 'MedPrimary',
  medPhmDim: 'MedPHM',
};

const UNDERSTAND_TASKS: Record<string, string> = {
  smdocDim: 'SMDoc',
  medRxCheckDim: 'MedRxCheck',
  medInsureCheckDim: 'MedInsureCheck',
  medInsureCalcDim: 'MedInsureCalc',
  medChartQcDim: 'MedChartQC',
  medReportQcDim: 'MedReportQC',
  medPathQcDim: 'MedPathQC',
  medTermDim: 'MedTerm',
  medSynonymDim: 'MedSynonym',
};

const SAFETY_TASKS: Record<string, string> = {
  medSafetyDim: 'MedSafety',
  medEthicsDim: 'MedEthics',
};

const parts: Record<string, BoardPart> = {
  vlmOverall: { name: 'Multimodal overall', group: 'Track', unit: 'score' },
  agentOverall: { name: 'Agent overall', group: 'Track', unit: 'score' },
  ...Object.fromEntries(Object.entries(LLM_DIMS).map(([k, name]) => [k, { name, group: 'Capability dimension', unit: 'score' }])),
  ...Object.fromEntries(Object.entries(KNOWLEDGE_TASKS).map(([k, name]) => [k, { name, group: 'Medical knowledge QA', unit: 'score' }])),
  ...Object.fromEntries(Object.entries(LANGGEN_TASKS).map(([k, name]) => [k, { name, group: 'Medical language generation', unit: 'score' }])),
  ...Object.fromEntries(Object.entries(INFER_TASKS).map(([k, name]) => [k, { name, group: 'Complex medical reasoning', unit: 'score' }])),
  ...Object.fromEntries(Object.entries(UNDERSTAND_TASKS).map(([k, name]) => [k, { name, group: 'Medical language understanding', unit: 'score' }])),
  ...Object.fromEntries(Object.entries(SAFETY_TASKS).map(([k, name]) => [k, { name, group: 'Medical safety and ethics', unit: 'score' }])),
};

const LLM_SCORE_KEYS = [
  ...Object.keys(LLM_DIMS),
  ...Object.keys(KNOWLEDGE_TASKS),
  ...Object.keys(LANGGEN_TASKS),
  ...Object.keys(INFER_TASKS),
  ...Object.keys(UNDERSTAND_TASKS),
  ...Object.keys(SAFETY_TASKS),
];

async function fetchTrack(genre: number, periodId: number): Promise<Entry[]> {
  const resp = await fetchJson<ApiResp>(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      periodVersion: 'v4',
      periodId,
      genre,
      evaluationType: 1,
      dimensionId: 0,
      sourceType: 0,
      sortField: '',
      sort: '',
      page: 1,
      pageSize: 100,
    }),
  });
  if (resp.code !== 0 || !Array.isArray(resp.data?.list)) throw new Error(`MedBench v4 track ${genre} request failed`);
  return resp.data.list;
}

function parseParams(raw?: string): { params?: number; activeParams?: number } {
  if (!raw || /^n\/a$/i.test(raw.trim())) return {};
  const moe = raw.trim().match(/^(\d+(?:\.\d+)?)\s*B?\s*-\s*A(\d+(?:\.\d+)?)\s*B?$/i);
  if (moe) return { params: Number(moe[1]), activeParams: Number(moe[2]) };
  const plain = raw.trim().match(/^(\d+(?:\.\d+)?)\s*B?$/i);
  if (plain) {
    const val = Number(plain[1]);
    if (Number.isFinite(val) && val > 0) return { params: val };
  }
  return {};
}

const board: Leaderboard = {
  benchmark: 'medbench-opencompass-4',
  url: 'https://medbench.opencompass.org.cn/home',
  feed: `${API} (periodVersion v4, official LLM, VLM and Agent leaderboards)`,
  terms: 'MedBench public leaderboard operated by Shanghai AI Laboratory and OpenCompass. https://medbench.opencompass.org.cn/',
  headline: 'LLM track overall score across five clinical capability dimensions, with matched multimodal and agent track overall scores and all 36 LLM subtasks kept in parts.',
  aliases: {
    'Grok-4': 'grok-4',
    'Claude-Sonnet-4.5': 'claude-sonnet-4-5',
    'Qwen2.5-vl-72b-instruct': 'qwen2-5-vl-72b',
    'o4-mini': 'o4-mini',
    'Llama-4-maverick': 'llama-4-maverick',
    'Gemini-2.5-Pro (2025-03-25)': 'gemini-2-5-pro-mar-2025',
    'GPT-5': 'gpt-5',
  },
  parts,
  stats: {
    activeParams: { name: 'Active parameters', unit: 'billions' },
  },
  async fetch() {
    const [llmList, agentList, vlmList] = await Promise.all([
      fetchTrack(1, 4),
      fetchTrack(2, 5),
      fetchTrack(3, 6),
    ]);
    if (llmList.length < 20) throw new Error(`Expected at least 20 MedBench v4 LLM rows, got ${llmList.length}`);

    const agentByName = new Map<string, number>();
    for (const e of agentList) {
      const name = e.modelName?.trim();
      const s = Number(e.scores?.overallScore);
      if (name && Number.isFinite(s) && !agentByName.has(name)) agentByName.set(name, s);
    }
    const vlmByName = new Map<string, number>();
    for (const e of vlmList) {
      const name = e.modelName?.trim();
      const s = Number(e.scores?.overallScore);
      if (name && Number.isFinite(s) && !vlmByName.has(name)) vlmByName.set(name, s);
    }

    const rows: LeaderboardRow[] = [];
    for (const e of llmList) {
      const rawName = e.modelName?.trim();
      const score = Number(e.scores?.overallScore);
      if (!rawName || !Number.isFinite(score)) continue;
      let model = rawName;
      let setting: string | undefined;
      if (rawName === 'Gemini-2.5-Pro-nothinking') {
        model = e.releasedAt?.startsWith('2025-03-25') ? 'Gemini-2.5-Pro (2025-03-25)' : 'Gemini-2.5-Pro (snapshot unspecified)';
        setting = 'no thinking';
      } else if (/^gpt-4o$/i.test(rawName)) {
        model = 'GPT-4o (snapshot unspecified)';
      }

      const metrics: Record<string, number> = {};
      for (const k of LLM_SCORE_KEYS) {
        const v = Number(e.scores?.[k]);
        if (Number.isFinite(v)) metrics[k] = v;
      }
      const vlm = vlmByName.get(rawName);
      if (vlm !== undefined) metrics.vlmOverall = vlm;
      const agent = agentByName.get(rawName);
      if (agent !== undefined) metrics.agentOverall = agent;

      const { params, activeParams } = parseParams(e.parametersScale);
      if (activeParams !== undefined) metrics.activeParams = activeParams;
      const evalDate = e.evaluationAt?.slice(0, 10);
      rows.push({
        model,
        score,
        setting,
        submitter: e.ownerName?.trim() || undefined,
        date: evalDate && /^\d{4}-\d{2}-\d{2}$/.test(evalDate) ? evalDate : undefined,
        open: e.sourceType === 1 ? true : e.sourceType === 2 ? false : undefined,
        params,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (rows.length < 20) throw new Error(`Parsed only ${rows.length} MedBench v4 rows`);
    return rows;
  },
};

export default board;
