// Valyrian Games ranks qualifying coding agents by the TrueSkill mean. Its JSON includes rating uncertainty, game records, average cost and generation speed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://valyriantech.github.io/ValyrianGamesLeaderboard/api/leaderboard.json";

const board: Leaderboard = {
  benchmark: "valyrian-games-coding-challenge",
  url: "https://valyriantech.github.io/ValyrianGamesLeaderboard/leaderboard.html",
  feed,
  terms: "The leaderboard repository carries an MIT license. https://github.com/ValyrianTech/ValyrianGamesLeaderboard GitHub Pages returns 404 for robots.txt.",
  aliases: {
    'OpenAI:gpt-5-mini':'gpt-5-mini', 'OpenAI:o4-mini-2025-04-16':'o4-mini', 'OpenAI:gpt-4.1-2025-04-14':'gpt-4-1',
    'OpenAI:o1-2024-12-17':'o1', 'Anthropic:claude-opus-4-1-20250805':'claude-opus-4-1', 'Anthropic:claude-sonnet-4-20250514':'claude-sonnet-4',
    'Anthropic:claude-opus-4-20250514':'claude-opus-4', 'Groq:openai/gpt-oss-120b':'gpt-oss-120b',
    'Together-ai:Qwen/Qwen3-235B-A22B-Instruct-2507-tput':'qwen3-235b-a22b-instruct-jul-2025',
    'Together-ai:Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8':'qwen3-coder-480b-a35b', 'Mistral:codestral-2501':'codestral',
    'OpenAI:gpt-4o-2024-08-06':'gpt-4o-aug-2024', 'OpenAI:o3-mini-2025-01-31':'o3-mini', 'Mistral:pixtral-large-2411':'pixtral-large',
    'Together-ai:Qwen/Qwen3-235B-A22B-Thinking-2507':'qwen3-235b-a22b-thinking-jul-2025',
    'Mistral:magistral-medium-2506':'magistral-medium-1-0', 'Mistral:devstral-medium-2507':'devstral-medium'
  },
  stats: {
    conservative_rating: { name: 'Conservative rating', unit: 'rating', better: 'higher' },
    games_played: { name: 'Games played', unit: 'count' },
    wins: { name: 'Wins', unit: 'count' },
    draws: { name: 'Draws', unit: 'count' },
    losses: { name: 'Losses', unit: 'count' },
    avg_tokens_per_second: { name: 'Average tokens per second', unit: 'tokens/s', better: 'higher' },
  },
  async fetch() {
    type Run = Record<string,number> & {name:string};
    const d = await fetchJson<{models:Run[]}>(feed);
    if (d.models.length < 18) throw new Error('Missing Valyrian Games qualifiers');
    return d.models.map(r => {
      const metrics: Record<string,number> = {};
      for (const k of ['sigma','conservative_rating','games_played','wins','draws','losses','avg_tokens_per_second']) {
        if (!Number.isFinite(r[k])) throw new Error('Missing ' + k);
        metrics[k === 'sigma' ? 'std' : k] = r[k];
      }
      if (!r.name || !Number.isFinite(r.mu) || !Number.isFinite(r.avg_total_cost)) throw new Error('Incomplete rating');
      return {model:r.name, score:r.mu, cost:r.avg_total_cost, metrics};
    });
  },
};

export default board;
