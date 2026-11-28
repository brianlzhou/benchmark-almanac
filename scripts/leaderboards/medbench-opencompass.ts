// MedBench tests Chinese medical language models across five medical evaluation dimensions.
// The score is the platform's overall score on MedBench, reported on a 0 to 100 scale.
// This importer reads the public MedBench evaluation period and full leaderboard endpoints.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const PERIODS = 'https://medbench.opencompass.org.cn/api/v1/base/evaluation/period/list?genre=1';
const LIST = (version: string) => `https://medbench.opencompass.org.cn/api/v1/base/evaluation/list/${version}`;

interface MedBenchItem {
  modelName: string;
  sourceType?: number;
  parametersScale?: string;
  evaluationAt?: string;
  scores: Record<string, string | undefined>;
}

const DIM_FIELDS = [
  ['medKnowledge', 'medKnowledgeDim'],
  ['medLangGen', 'medLangGenDim'],
  ['medComplexInfer', 'medComplexInferDim'],
  ['medSee', 'medSeeDim'],
  ['medSafetyEthics', 'medSafetyEthicsDim'],
] as const;

const board: Leaderboard = {
  benchmark: 'medbench-opencompass',
  url: 'https://medbench.opencompass.org.cn/leaderboard',
  feed: `${PERIODS} -> https://medbench.opencompass.org.cn/api/v1/base/evaluation/list/<version>`,
  terms: 'MedBench public leaderboard. https://medbench.opencompass.org.cn/',
  parts: {
    medKnowledge: { name: 'Medical knowledge QA', group: 'Dimension' },
    medLangGen: { name: 'Medical language generation', group: 'Dimension' },
    medComplexInfer: { name: 'Complex medical reasoning', group: 'Dimension' },
    medSee: { name: 'Medical language understanding', group: 'Dimension' },
    medSafetyEthics: { name: 'Medical safety and ethics', group: 'Dimension' },
  },
  async fetch() {
    const periods = await fetchJson<{ data?: { list?: { periodId: number; version: string }[] } }>(PERIODS);
    const latest = periods.data?.list?.[0];
    if (!latest?.periodId || !latest.version) throw new Error('Missing MedBench evaluation period');
    const items: MedBenchItem[] = [];
    for (let page = 1; ; page++) {
      const res = await fetch(LIST(latest.version), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          page, pageSize: 100, evaluationType: 1, dimensionId: 0, genre: 1,
          sourceType: 0, sortField: '', sort: '', periodId: latest.periodId,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`MedBench list ${res.status}`);
      const json = await res.json() as { data?: { list?: MedBenchItem[]; pageData?: { count?: number } } };
      const batch = json.data?.list ?? [];
      items.push(...batch);
      const total = json.data?.pageData?.count ?? items.length;
      if (!batch.length || items.length >= total) break;
    }
    const rows: LeaderboardRow[] = [];
    for (const r of items) {
      const score = Number(r.scores?.overallScore);
      if (!r.modelName || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const [key, field] of DIM_FIELDS) {
        const v = Number(r.scores?.[field]);
        if (Number.isFinite(v)) metrics[key] = v;
      }
      const paramsNum = Number(r.parametersScale);
      const dateStr = r.evaluationAt?.slice(0, 10);
      rows.push({
        model: r.modelName,
        score,
        open: r.sourceType === 1 ? true : r.sourceType === 2 ? false : undefined,
        params: Number.isFinite(paramsNum) && paramsNum > 0 ? paramsNum : undefined,
        date: dateStr && /^\d{4}-\d\d-\d\d$/.test(dateStr) ? dateStr : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return checked(rows, 10);
  },
};
export default board;
