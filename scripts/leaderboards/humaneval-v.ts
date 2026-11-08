// HumanEval-V. humaneval-v.github.io loads leaderboard_data.json: per model pass@1 (greedy) and pass@3 under
// four settings (V2C, V2C with CoT, V2T2C, V2T2C with GPT-4o). The page's summary names V2C with CoT pass@1
// as its headline ("Claude 3.5 Sonnet achieving only 36.8% pass@1"), and the record reports pass@1, so the
// score is "v2c-cot@1". (The table's default sort is V2T2C with GPT-4o pass@3, which OpenAI o1 lacks.)
// Names carry the API snapshot in parentheses, "GPT-4o (0806)", which the aliases map. Pass@3 in the same
// setting, "v2c-cot@3", is kept as `passAt3`. Other pass@1 settings remain separately labeled.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const PAGE = 'https://humaneval-v.github.io/';
const FEED = 'https://humaneval-v.github.io/leaderboard_data.json';

const board: Leaderboard = {
  benchmark: 'humaneval-v',
  url: PAGE,
  feed: `${FEED} (all pass@1 settings, with matching pass@3 metrics)`,
  terms: 'Static JSON on the HumanEval-V GitHub Pages site, which has no robots.txt; the repository states no license, so only the published numbers are read.',
  aliases: {
    'Claude 3.5 Sonnet (1022)': 'claude-3-5-sonnet-october-2024',
    'GPT-4o (0806)': 'gpt-4o-aug-2024',
    'GPT-4o-mini (0718)': 'gpt-4o-mini',
    'Gemini 1.5 Pro (002)': 'gemini-1-5-pro-sept-2024',
    'Gemini 1.5 Flash (002)': 'gemini-1-5-flash-sep-2024',
    'OpenAI o1': 'o1',
    'Pixtral 124B': 'pixtral-large',
    'Qwen2 VL 72B': 'qwen2-vl-72b-instruct',
    'LLaVA-OV 72B': 'llava-onevision-72b',
    'Molmo-D 72B': 'molmo-72b',
    'Molmo-D 7B': 'molmo-7b-d',
    'Llama-3.2-V 90B': 'llama-3-2-90b',
    'Llama-3.2-V 11B': 'llama-3-2-11b',
    'Phi-3.5-V 4B': 'phi-3-5-vision-instruct',
  },
  async fetch() {
    const data = await fetchJson<{ info: Record<string, string> }[]>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const { info } of data) {
      const score = num(info['v2c-cot@1']);
      if (!info.model || score === undefined) continue;
      const pass3 = num(info['v2c-cot@3']);
      rows.push({ model: info.model, score, ...(pass3 !== undefined ? { metrics: { passAt3: pass3 } } : {}) });
    }
    for(const {info} of data) for(const setting of ['v2c','v2t2c','v2t2c-4o']){
      const score=num(info[setting+'@1']);if(!info.model||score===undefined)continue;
      const pass3=num(info[setting+'@3']);rows.push({model:info.model,score,setting,...(pass3===undefined?{}:{metrics:{passAt3:pass3}})});
    }
    return rows;
  },
};
export default board;
