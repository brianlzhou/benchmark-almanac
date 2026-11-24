// The Open Chinese LLM Leaderboard evaluates language models on Chinese tasks.
// Its Average column is the mean of the published benchmark scores, in score points.
// This importer reads the live Gradio dataframe exposed by the leaderboard Space.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://huggingface.co/spaces/BAAI/open_cn_llm_leaderboard';
const FEED = 'https://baai-open-cn-llm-leaderboard.hf.space/config';

type Config = {
  components?: Array<{ type?: string; props?: { value?: { headers?: string[]; data?: unknown[][] } } }>;
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();

const PART_COLS = ['C-ARC', 'C-HellaSwag', 'C-TruthfulQA', 'C-Winogrande', 'C-GSM8K', 'C-SEM', 'C-MMLU', 'CLCC-H'] as const;

const board: Leaderboard = {
  benchmark: 'open-chinese-llm-leaderboard',
  url: URL,
  feed: FEED,
  terms: 'The Space is published under the Apache License 2.0. https://www.apache.org/licenses/LICENSE-2.0',
  parts: Object.fromEntries(PART_COLS.map((k) => [k, { name: k, unit: 'score', better: 'higher' as const }])),
  async fetch(): Promise<LeaderboardRow[]> {
    const config = await fetchJson<Config>(FEED);
    const table = config.components?.find((component) => {
      const value = component.props?.value;
      return component.type === 'dataframe' && value?.headers?.includes('Average ⬆️') && value.headers.includes('Model');
    })?.props?.value;
    if (!table?.headers || !table.data) throw new Error('Leaderboard dataframe missing');
    const modelColumn = table.headers.indexOf('Model');
    const scoreColumn = table.headers.indexOf('Average ⬆️');
    const partIndices = PART_COLS.map((col) => [col, table.headers!.indexOf(col)] as const).filter(([, idx]) => idx >= 0);
    const rows = table.data.map((row) => {
      const raw = typeof row[modelColumn] === 'string' ? row[modelColumn] : '';
      const model = stripHtml(raw).replace(/\s*📑.*$/, '').trim();
      const link = raw.match(/href="(https?:\/\/[^"]+)"/)?.[1];
      const score = Number(row[scoreColumn]);
      const metrics: Record<string, number> = {};
      for (const [col, idx] of partIndices) {
        const val = Number(row[idx]);
        if (row[idx] !== '' && row[idx] != null && Number.isFinite(val)) metrics[col] = val;
      }
      return { model, score, link, ...(Object.keys(metrics).length ? { metrics } : {}) };
    }).filter((row) => row.model && Number.isFinite(row.score));
    return checked(rows, 2);
  },
};

export default board;
