// AGI-Eval reports GSM8K accuracy with chain-of-thought prompting on its fine-tuned model board.
// Read the latest monthly public table containing completed evaluations and convert fractions to percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const agiApi = 'https://agi-eval.org/commWebApi/model/rank/';
export const agiTerms = 'AGI-Eval serves its home page at robots.txt and gives no score reuse license on the public rankings.';
interface Result {
  name: string;
  evalTime?: string;
  openStatus: number;
  projectList: { project: string; score: string }[];
}

export async function agiRows(modality: string, modelType: string, column: string, minimum: number): Promise<LeaderboardRow[]> {
  const query = { modality, modelType, rankType: 'PUBLIC' };
  const post = async <T>(path: string, params: object) => {
    const response = await fetchJson<{ rescode: number; data: T; msg: string }>(agiApi + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...query, ...params }),
    });
    if (response.rescode !== 0) throw new Error(response.msg);
    return response.data;
  };
  const { rankDateList } = await post<{rankDateList: string[]}>('listDate', {});
  for (const rankMonth of rankDateList) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { modelRankList } = await post<{modelRankList: Result[]}>('dataList', { rankMonth, limit: 1000 });
    const rows: LeaderboardRow[] = [];
    for (const item of modelRankList) {
      const cell = item.projectList.find(p => p.project === column);
      if (!cell) throw new Error('AGI-Eval: missing ' + column + ' for ' + item.name);
      if (cell.score === '评测中' || cell.score === '-') continue;
      if (!item.name || !/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(cell.score)) throw new Error('Invalid score for ' + item.name);
      rows.push({ model: item.name, score: Number((Number(cell.score) * 100).toFixed(6)), date: item.evalTime,
        open: item.openStatus === 1, setting: item.name.match(/(no[- ]reasoning|no[- ]thinking|thinking(?: \(high\))?|chat|on|off|auto)(?:$|-(?:speciale|2507|pro-2504)$)/i)?.[1] });
    }
    if (!rows.length) continue;
    if (rows.length < minimum || modelRankList.length >= 1000) throw new Error('Incomplete AGI-Eval table for ' + column);
    return rows;
  }
  throw new Error('AGI-Eval: no published scores for ' + column);
}

const board: Leaderboard = {
  benchmark: 'gsm8k', host: 'AGI-Eval',
  url: 'https://agi-eval.org/topRanking?modality=LARGE_LANGUAGE_MODEL&modelType=FINE_TUNED&rankType=PUBLIC',
  feed: agiApi + 'dataList', terms: agiTerms,
  aliases: {
    'Claude-Opus-4.5-no-reasoning': 'claude-opus-4-5', 'GPT-5-Thinking (High)': 'gpt-5',
    'DeepSeek-V3.2-Thinking-Speciale': 'deepseek-v3-2-speciale', 'Kimi-K2.5-Chat': 'kimi-k2-5',
    'Doubao-Seed-1.6-On': 'doubao-seed-1-6', 'Doubao-Seed-1.6-Auto': 'doubao-seed-1-6',
    'Doubao-Seed-1.6-Off': 'doubao-seed-1-6', 'DeepSeek-V3-Chat-1226': 'deepseek-v3',
    'GPT-4o-1120': 'gpt-4o-nov-2024', 'GPT-4o-0513': 'gpt-4o-may-2024',
    'Claude-3.5-Sonnet-1022': 'claude-3-5-sonnet-october-2024', 'Gemma2-9B-Instruct': 'gemma-2-9b',
    'LLama3.1-70B-instruct': 'llama-3-1-70b', 'LLama3.1-8B-instruct': 'llama-3-1-8b',
    'Llama3.1-405B-Instruct': 'llama-3-1-405b',
    ...Object.fromEntries(['0.5','1.5','3','7','14','32'].map(size =>
      ['Qwen2.5-' + size + 'B-Instruct', 'qwen2-5-' + size.replace('.', '-') + 'b'])),
  },
  fetch: () => agiRows('LARGE_LANGUAGE_MODEL', 'FINE_TUNED', 'GSM8K-COT（英）', 112),
};
export default board;
