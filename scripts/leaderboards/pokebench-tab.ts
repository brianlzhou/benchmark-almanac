// PokéBench ranks tool-assisted Pokémon Red runs by milestones reached, breaking ties by turn count. The run feed records each milestone and resource use.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Run {category: string; display_name: string; model: string; prompt_version: string; think_level?: string; quant?: string; harness_version: number; run_date: string; furthest_index: number; turns_used: number; tokens_in?: number; tokens_out?: number; wall_time_s?: number; cost_usd?: number; youtube_url?: string; model_params?: string; milestones: {key: string; turn: number}[]}

const feed = "https://pokebench.tv/runs.json";
const board: Leaderboard = {
  benchmark: 'pokebench-tab',
  url: "https://pokebench.tv/",
  feed,
  terms: "The site's robots file publishes content signals. The repository uses the MIT license. It excludes the game ROM. https://raw.githubusercontent.com/VibeCodyH/pokebench/main/LICENSE",
  costPer: 'run',
  stats: { turns: { name: 'Turns', unit: 'count', better: 'lower' }, inputTokens: { name: 'Input tokens', unit: 'tokens' }, elapsedSeconds: { name: 'Elapsed time', unit: 'seconds', better: 'lower' }, left_house_turn: { name: 'Turn left the house', unit: 'count', better: 'lower' }, got_starter_turn: { name: 'Turn got a starter', unit: 'count', better: 'lower' }, route_1_turn: { name: 'Turn reached Route 1', unit: 'count', better: 'lower' }, viridian_city_turn: { name: 'Turn reached Viridian City', unit: 'count', better: 'lower' }, got_parcel_turn: { name: 'Turn got parcel', unit: 'count', better: 'lower' }, got_pokedex_turn: { name: 'Turn got Pokédex', unit: 'count', better: 'lower' }, viridian_forest_turn: { name: 'Turn reached Viridian Forest', unit: 'count', better: 'lower' }, pewter_city_turn: { name: 'Turn reached Pewter City', unit: 'count', better: 'lower' }, pewter_gym_turn: { name: 'Turn reached Pewter Gym', unit: 'count', better: 'lower' }, beat_brock_turn: { name: 'Turn beat Brock', unit: 'count', better: 'lower' } },
  async fetch() {
    const runs = (await fetchJson<Run[]>(feed)).filter(r => r.category === 'tab');
    if (runs.length < 41) throw new Error('Missing TAB runs');
    return runs.map(r => {
      if (!r.display_name || !Number.isInteger(r.furthest_index) || !Number.isFinite(r.turns_used) || !r.prompt_version) throw new Error('Invalid TAB run');
      const metrics: Record<string, number> = { turns: r.turns_used };
      if (r.tokens_in != null) metrics.inputTokens = r.tokens_in;
      if (r.wall_time_s != null) metrics.elapsedSeconds = r.wall_time_s;
      for (const m of r.milestones) if (Number.isFinite(m.turn)) metrics[m.key + '_turn'] = m.turn;
      return { model: r.display_name, setting: [r.model, 'prompt ' + r.prompt_version, r.think_level, r.quant].filter(Boolean).join(', '),
        harness: 'TAB v' + r.harness_version, score: r.furthest_index + 1, date: r.run_date, tokens: r.tokens_out ?? undefined, cost: r.cost_usd ?? undefined,
        params: r.model_params?.endsWith('B') ? parseFloat(r.model_params) : undefined, link: r.youtube_url || undefined, metrics };
    });
  },
};
export default board;
