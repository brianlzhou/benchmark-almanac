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

const board: Leaderboard = {
  benchmark: 'open-chinese-llm-leaderboard',
  url: URL,
  feed: FEED,
  terms: 'The Space is published under the Apache License 2.0. https://www.apache.org/licenses/LICENSE-2.0',
  async fetch(): Promise<LeaderboardRow[]> {
    const config = await fetchJson<Config>(FEED);
    const table = config.components?.find((component) => {
      const value = component.props?.value;
      return component.type === 'dataframe' && value?.headers?.includes('Average ⬆️') && value.headers.includes('Model');
    })?.props?.value;
    if (!table?.headers || !table.data) throw new Error('Leaderboard dataframe missing');
    const modelColumn = table.headers.indexOf('Model');
    const scoreColumn = table.headers.indexOf('Average ⬆️');
    const rows = table.data.map((row) => {
      const model = typeof row[modelColumn] === 'string' ? stripHtml(row[modelColumn]) : '';
      const score = Number(row[scoreColumn]);
      return { model, score };
    }).filter((row) => row.model && Number.isFinite(row.score));
    return checked(rows, 2);
  },
};

export default board;
