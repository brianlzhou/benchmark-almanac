// Nejumi LLM Leaderboard 4 (Weights & Biases Japan).
// Evaluates Japanese and general language models across General Language Performance (GLP) and Alignment (ALT)
// on the W&B project llm-leaderboard/nejumi-leaderboard4. Queries W&B GraphQL for runs tagged "leaderboard"
// and reads each run's logged leaderboard_table JSON. The headline score is TOTAL_SCORE (0 to 1), with all
// GLP categories, subcategories, ALT dimensions and suite averages declared in parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://api.wandb.ai/graphql';
const PROJECT = 'llm-leaderboard/nejumi-leaderboard4';

interface Run {
  name: string;
  displayName: string;
  createdAt: string;
  summaryMetrics: string;
}
interface Page {
  data: {
    project: {
      runs: {
        edges: { node: Run }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };
  };
}
interface Table {
  columns: string[];
  data: (string | number | null)[][];
}

const QUERY = `query ($after: String, $filters: JSONString!) {
  project(entityName: "llm-leaderboard", name: "nejumi-leaderboard4") {
    runs(first: 100, after: $after, filters: $filters) {
      edges { node { name displayName createdAt summaryMetrics } }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

const COLUMN_MAP: Record<string, [string, BoardPart]> = {
  '汎用的言語性能(GLP)_AVG': ['glp_avg', { name: 'General Language Performance', group: 'Main category' }],
  'アラインメント(ALT)_AVG': ['alt_avg', { name: 'Alignment', group: 'Main category' }],
  'GLP_応用的言語性能': ['glp_applied', { name: 'Applied Language Skills', group: 'GLP category' }],
  'GLP_推論能力': ['glp_reasoning', { name: 'Reasoning', group: 'GLP category' }],
  'GLP_知識・質問応答': ['glp_knowledge', { name: 'Knowledge and QA', group: 'GLP category' }],
  'GLP_基礎的言語性能': ['glp_foundational', { name: 'Foundational Language Skills', group: 'GLP category' }],
  'GLP_アプリケーション開発': ['glp_appdev', { name: 'Application Development', group: 'GLP category' }],
  'GLP_表現': ['glp_expression', { name: 'Expression', group: 'GLP subcategory' }],
  'GLP_翻訳': ['glp_translation', { name: 'Translation', group: 'GLP subcategory' }],
  'GLP_情報検索': ['glp_retrieval', { name: 'Information Retrieval', group: 'GLP subcategory' }],
  'GLP_抽象的推論': ['glp_abstract', { name: 'Abstract Reasoning', group: 'GLP subcategory' }],
  'GLP_論理的推論': ['glp_logical', { name: 'Logical Reasoning', group: 'GLP subcategory' }],
  'GLP_数学的推論': ['glp_math', { name: 'Mathematical Reasoning', group: 'GLP subcategory' }],
  'GLP_一般的知識': ['glp_general_knowledge', { name: 'General Knowledge', group: 'GLP subcategory' }],
  'GLP_専門的知識': ['glp_specialized_knowledge', { name: 'Specialized Knowledge', group: 'GLP subcategory' }],
  'GLP_意味解析': ['glp_semantic', { name: 'Semantic Analysis', group: 'GLP subcategory' }],
  'GLP_構文解析': ['glp_syntactic', { name: 'Syntactic Analysis', group: 'GLP subcategory' }],
  'GLP_コーディング': ['glp_coding', { name: 'Coding', group: 'GLP subcategory' }],
  'GLP_関数呼び出し': ['glp_function_calling', { name: 'Function Calling', group: 'GLP subcategory' }],
  'ALT_制御性': ['alt_controllability', { name: 'Controllability', group: 'Alignment' }],
  'ALT_倫理・道徳': ['alt_ethics', { name: 'Ethics and Morality', group: 'Alignment' }],
  'ALT_毒性': ['alt_toxicity', { name: 'Toxicity', group: 'Alignment' }],
  'ALT_バイアス': ['alt_bias', { name: 'Bias', group: 'Alignment' }],
  'ALT_真実性': ['alt_truthfulness', { name: 'Truthfulness', group: 'Alignment' }],
  'ALT_堅牢性': ['alt_robustness', { name: 'Robustness', group: 'Alignment' }],
  AVG_jaster_0shot: ['avg_jaster_0shot', { name: 'Jaster 0-shot', group: 'Suite' }],
  AVG_jaster_2shots: ['avg_jaster_2shots', { name: 'Jaster 2-shot', group: 'Suite' }],
  AVG_mtbench: ['avg_mtbench', { name: 'MT-bench', group: 'Suite' }],
  AVG_swebench: ['avg_swebench', { name: 'SWE-bench', group: 'Suite' }],
};

const pause = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

function settingFromDisplay(displayName: string, modelName: string): string | undefined {
  const colon = displayName.match(/:\s+(.+)$/);
  if (colon) return colon[1].trim();
  const paren = displayName.match(/\(([^)]+)\)\s*$/);
  if (paren && !modelName.includes(paren[1])) return paren[1].trim();
  return undefined;
}

const board: Leaderboard = {
  benchmark: 'nejumi-llm-leaderboard-4',
  url: 'https://wandb.ai/wandb-japan/llm-leaderboard4/reports/Nejumi-LLM-4--Vmlldzo5NTI0MDI0',
  feed: FEED,
  terms: 'Public Weights & Biases evaluation runs referenced by wandb/llm-leaderboard v4.0.0. https://github.com/wandb/llm-leaderboard/tree/v4.0.0',
  aliases: {
    'mistral-large-4-0': 'mistral-large-4',
  },
  parts: Object.fromEntries(Object.values(COLUMN_MAP)),
  async fetch(): Promise<LeaderboardRow[]> {
    const runs: Run[] = [];
    let after: string | null = null;
    do {
      const page: Page = await fetchJson<Page>(FEED, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: QUERY, variables: { after, filters: JSON.stringify({ tags: { $in: ['leaderboard'] } }) } }),
      });
      const conn = page.data?.project?.runs;
      if (!conn) throw new Error('Nejumi 4 W&B project missing');
      for (const { node } of conn.edges) runs.push(node);
      after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
      if (after) await pause();
    } while (after);

    const byConfig = new Map<string, { createdAt: string; row: LeaderboardRow }>();
    for (let i = 0; i < runs.length; i++) {
      const node = runs[i];
      const summary = JSON.parse(node.summaryMetrics || '{}') as { leaderboard_table?: { path?: string } };
      const path = summary.leaderboard_table?.path;
      if (!path?.startsWith('media/table/leaderboard_table_')) continue;
      if (i > 0) await pause();
      const source = await fetchText(`https://api.wandb.ai/files/${PROJECT}/${node.name}/${path}`);
      const table = JSON.parse(source.replace(/([,\[]\s*)NaN(?=\s*[,\]])/g, '$1null')) as Table;
      if (!table.columns?.includes('TOTAL_SCORE') || !table.columns.includes('model_name') || !table.data?.length) {
        throw new Error(`Missing Nejumi 4 columns in run ${node.name}`);
      }
      for (const cells of table.data) {
        const rec = Object.fromEntries(table.columns.map((k, idx) => [k, cells[idx]]));
        if (typeof rec.TOTAL_SCORE !== 'number' || !Number.isFinite(rec.TOTAL_SCORE) || typeof rec.model_name !== 'string') continue;
        const metrics: Record<string, number> = {};
        for (const [col, [key]] of Object.entries(COLUMN_MAP)) {
          const v = rec[col];
          if (typeof v === 'number' && Number.isFinite(v)) metrics[key] = v;
        }
        const params = typeof rec.model_size === 'number' && rec.model_size > 0 ? rec.model_size / 1e9 : undefined;
        const setting = settingFromDisplay(node.displayName, rec.model_name);
        const cfgKey = `${rec.model_name}\t${setting ?? ''}`;
        const prev = byConfig.get(cfgKey);
        if (prev && prev.createdAt >= node.createdAt) continue;
        byConfig.set(cfgKey, {
          createdAt: node.createdAt,
          row: {
            model: rec.model_name,
            setting,
            score: rec.TOTAL_SCORE,
            date: node.createdAt.slice(0, 10),
            link: `https://wandb.ai/${PROJECT}/runs/${node.name}`,
            params,
            metrics,
          },
        });
      }
    }
    return checked([...byConfig.values()].map((x) => x.row), 100);
  },
};

export default board;
