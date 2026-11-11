// HUMAINE: the published overall Bradley-Terry-Davidson rating is the headline score.
// Dimension ratings are secondary metrics. Demographic slices do not represent the whole benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/ProlificAI/humaine-leaderboard/resolve/main/leaderboard-app/public/btd_frontend_data.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "humaine",
  url: "https://huggingface.co/spaces/ProlificAI/humaine-leaderboard",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {
    'qwen3-235b-a22b-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'deepseek-chat-v3-0324': 'deepseek-v3-mar-2025',
    'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
    'command-a': 'cohere-command-a',
  },
  
  async fetch() {
    const data = await fetchJson<any>(FEED);
    const out: LeaderboardRow[] = [];
    function add(list: any[], setting: string) {
      for (const r of list ?? []) {
        if (!r.model_name || typeof r.score !== 'number') continue;
        const metrics: Record<string, number> = {};
        for (const k of ['p_best','expected_rank','score_std','total_comparisons']) if (typeof r[k] === 'number') metrics[k] = r[k];
        if (r.score_ci_95) {metrics.ciLow = r.score_ci_95.lower; metrics.ciHigh = r.score_ci_95.upper;}
        const name = r.model_name.split('/').at(-1);
        out.push({model: identity(name), score: r.score, setting, metrics});
      }
    }
    add(data.overall_rankings, 'Overall');
    for (const row of out) {
      delete row.setting;
      for (const [metric, list] of Object.entries(data.metric_rankings ?? {})) {
        const rating = (list as any[]).find(r => identity(r.model_name.split('/').at(-1)) === row.model);
        if (typeof rating?.score === 'number') row.metrics![metric] = rating.score;
      }
    }
    if (!out.length) throw new Error('HUMAINE rating arrays missing');
    return out;
  },
};
export default board;
