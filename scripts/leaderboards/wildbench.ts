// WildBench v2 (Ai2). The allenai/WildBench Space builds its board from data_dir/all_stat_wildbench.-1.json
// in its own repository: per model the WB-Score (checklist-guided judge score on 1,024 real-user tasks),
// pairwise WB-Reward columns and the WB-Elo ratings fitted from them. The page ranks by WB-Elo (LC) by
// default and offers "WB-Score (Raw)" as a ranking. The almanac's record scores WildBench as WB-Score, the
// figure launch posts quote, so WB_score is the score here. The file is the untruncated (K = infinity)
// table, the page's default. The board stopped adding models in late 2024. A date stamp in the name picks
// the snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/allenai/WildBench/resolve/main/data_dir/all_stat_wildbench.-1.json';

const board: Leaderboard = {
  benchmark: 'wildbench',
  url: 'https://huggingface.co/spaces/allenai/WildBench',
  feed: `${FEED} (WB_score)`,
  terms: 'Results file in the allenai/WildBench Hugging Face Space; the WildBench code is Apache-2.0 and the Space states no other terms.',
  aliases: {},
  async fetch() {
    const data = await fetchJson<Record<string, { WB_score?: number }>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, m] of Object.entries(data)) {
      if (typeof m.WB_score !== 'number') continue;
      // "Qwen1.5-72B-Chat-greedy": decoding note, not part of the name
      const model = name.replace(/-greedy$/, '');
      const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
      rows.push({ model, score: m.WB_score, date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined });
    }
    return rows;
  },
};
export default board;
