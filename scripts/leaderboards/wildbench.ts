// WildBench v2 (Ai2). The allenai/WildBench Space builds its board from data_dir/all_stat_wildbench.-1.json
// in its own repository: per model the WB-Score (checklist-guided judge score on 1,024 real-user tasks),
// pairwise WB-Reward columns and the WB-Elo ratings fitted from them. The page ranks by WB-Elo (LC) by
// default and offers "WB-Score (Raw)" as a ranking. The almanac's record scores WildBench as WB-Score, the
// figure launch posts quote, so WB_score is the score here. The file is the untruncated (K = infinity)
// table, the page's default. The board stopped adding models in 2024, so a name with no date stamp is dated
// 2024-08-01 and the resolver picks the snapshot current then. The preview Yi and original Reka Edge
// entries remain unlisted, explicitly distinguished from their registry namesakes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/allenai/WildBench/resolve/main/data_dir/all_stat_wildbench.-1.json';

const UNLISTED: Record<string, string> = { 'yi-large-preview': 'yi-large-preview (unlisted preview)', 'reka-edge': 'reka-edge (2024 release)' };

const board: Leaderboard = {
  benchmark: 'wildbench',
  url: 'https://huggingface.co/spaces/allenai/WildBench',
  feed: `${FEED} (WB_score)`,
  terms: 'Results file in the allenai/WildBench Hugging Face Space; the WildBench code is Apache-2.0 and the Space states no other terms.',
  aliases: {
    'Meta-Llama-3-70B-Instruct': 'llama-3-70b',
    'Meta-Llama-3-8B-Instruct': 'llama-3-8b',
    'mistral-large-2402': 'mistral-large',
    'Mistral-Large-2': 'mistral-large-2-jul-2024',
    'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'Mistral-Nemo-Instruct-2407': 'mistral-nemo',
    'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'Llama-2-70b-chat-hf': 'llama-2-70b',
    'Llama-2-7b-chat-hf': 'llama-2-7b',
    'gemma-7b-it': 'gemma-7b',
    'gemma-2b-it': 'gemma-2b',
    'gemma-2-9b-it': 'gemma-2-9b',
    'gemma-2-27b-it': 'gemma-2-27b',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
    'deepseekv2-chat': 'deepseek-v2-moe-236b-may-2024',
    'dbrx-instruct': 'dbrx',
  },
  async fetch() {
    const data = await fetchJson<Record<string, { WB_score?: number }>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, m] of Object.entries(data)) {
      if (typeof m.WB_score !== 'number') continue;
      // "Qwen1.5-72B-Chat-greedy": decoding note, not part of the name
      const model = UNLISTED[name] ?? name.replace(/-greedy$/, '');
      const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
      rows.push({ model, score: m.WB_score, date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : '2024-08-01' });
    }
    return rows;
  },
};
export default board;
