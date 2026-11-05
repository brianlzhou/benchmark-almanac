// ParseBench (LlamaIndex). parsebench.ai loads leaderboard.csv from the run-llama/ParseBench repository
// (Apache-2.0): per parser or model its category, Overall score (0 to 100) and cost per page. Overall is
// the score. Cost_Per_Page is in US cents (the page divides it by 100 and shows "0.4¢ / page"), so the cost
// per task (one page) is Cost_Per_Page / 100 dollars. Vision-language model rows are named "Maker Model (Setting)", such as "OpenAI GPT-5 Mini
// (Reasoning Minimal)" or "Anthropic Opus 4.6". The maker is dropped (Anthropic tiers get "Claude" back)
// and the setting is kept. Parser products (LlamaParse, IDP and startup APIs) have no model in the
// registry and stay unmatched.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/run-llama/ParseBench/main/leaderboard.csv';

const board: Leaderboard = {
  benchmark: 'parsebench',
  url: 'https://parsebench.ai',
  feed: `${FEED} (Overall)`,
  terms: 'Repository file in run-llama/ParseBench, licensed Apache-2.0.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.Overall);
      if (!r.Provider || !Number.isFinite(score)) continue;
      let name = r.Provider.trim();
      const paren = name.match(/\s*\(([^()]+)\)$/);
      if (paren) name = name.slice(0, paren.index).trim();
      if (/^VLM/.test(r.Category)) {
        name = name.replace(/^(OpenAI|Google|xAI|Meta|Mistral|Alibaba|Moonshot|DeepSeek)\s+/, '');
        name = name.replace(/^Anthropic\s+/, 'Claude ');
      }
      // "Reasoning Minimal", "Thinking High", "Effort Low": the level is the setting
      const level = paren?.[1].match(/(?:Reasoning|Thinking|Effort)\s+(\w+)/i)?.[1];
      const setting = level ? level.toLowerCase() : paren?.[1].toLowerCase();
      const cents = Number(r.Cost_Per_Page);
      rows.push({ model: name, score, setting, cost: Number.isFinite(cents) && cents > 0 ? cents / 100 : undefined });
    }
    return rows;
  },
};
export default board;
