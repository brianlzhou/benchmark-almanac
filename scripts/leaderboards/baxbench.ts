// BaxBench (ETH Zurich SRI Lab, LogicStar.ai and others). baxbench.com loads one JSON per prompt type from
// /static/data/: leaderboard_data_none.json (no security reminder, the page's default), _generic.json and
// _specific.json (the oracle reminder naming the relevant weaknesses). Each row has pass_1 (functionally
// correct) and sec_pass_1 (correct and secure, 0 to 1), the default sort and the score here (0 to 100). The
// default prompt has no setting; the two reminder prompts keep theirs. The abb_* files belong to a separate
// benchmark and are not read. pass_1, the functionally correct share before the security check, is kept as
// `correct` (0 to 100).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DATA = (kind: string) => `https://baxbench.com/static/data/leaderboard_data_${kind}.json`;
const PROMPTS: [string, string | undefined][] = [
  ['none', undefined],
  ['generic', 'generic security reminder'],
  ['specific', 'oracle security reminder'],
];

const board: Leaderboard = {
  benchmark: 'baxbench',
  url: 'https://baxbench.com/',
  feed: `${DATA('{none,generic,specific}')} (sec_pass_1)`,
  terms: 'Static JSON on the BaxBench GitHub Pages site, which states no terms; the BaxBench repository and dataset are MIT.',
  aliases: {
    // "DeepSeek V3 03-24" is listed apart, so plain "DeepSeek V3" is the December 2024 model
    'DeepSeek V3': 'deepseek-v3',
    'DeepSeek V3 03-24': 'deepseek-v3-mar-2025',
    'OpenAI o1': 'o1',
    'OpenAI o3': 'o3',
    'OpenAI o3-mini': 'o3-mini',
    'Qwen3 235B': 'qwen3-235b-a22b',
    'Claude 4 Sonnet': 'claude-sonnet-4',
    'DS R1 Distill Llama 70B': 'deepseek-r1-distill-llama-70b',
    'DS R1 Distill Qwen 1.5B': 'deepseek-r1-distill-qwen-1-5b',
    'DS R1 Distill Qwen 14B': 'deepseek-r1-distill-qwen-14b',
    'DS R1 Distill Qwen 32B': 'deepseek-r1-distill-qwen-32b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [kind, setting] of PROMPTS) {
      const data = await fetchJson<{ model: string; pass_1?: number; sec_pass_1?: number }[]>(DATA(kind));
      for (const r of data) {
        if (!r.model || typeof r.sec_pass_1 !== 'number') continue;
        // "Grok 3 Thinking": the mode is kept next to the prompt type
        const thinking = /\sThinking$/i.test(r.model);
        const model = r.model.replace(/\sThinking$/i, '');
        rows.push({
          model,
          score: r.sec_pass_1 * 100,
          setting: [thinking ? 'thinking' : undefined, setting].filter(Boolean).join(', ') || undefined,
          ...(typeof r.pass_1 === 'number' ? { metrics: { correct: r.pass_1 * 100 } } : {}),
        });
      }
    }
    return rows;
  },
};
export default board;
