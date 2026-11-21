// WTP-Bench scores Pokémon recognition from artwork and silhouettes. The public JavaScript data module supplies the default Master Ball exact-match score and three other tiers.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://sochastic.me/WTP-Bench/js/data/leaderboard.js";
const board: Leaderboard = {
  benchmark: "wtp-bench",
  url: "https://sochastic.me/WTP-Bench/#leaderboard",
  feed: FEED,
  terms: "The repository states Apache 2.0. The site reserves artwork rights to their owners and cites noncommercial academic fair use. https://github.com/eternal-f1ame/WTP-Bench and https://sochastic.me/WTP-Bench/ The robots file allows this feed for the importer.",
  parts: { ultraBall: 'Ultra Ball', greatBall: 'Great Ball', shadowBall: 'Shadow Ball' },
  aliases: {
  "Claude 4.5 Sonnet": "claude-sonnet-4-5",
  "Qwen3-VL 4B": "qwen3-vl-4b-instruct",
  "Grok 4": "grok-4-fast",
  "SmolVLM": "smolvlm-instruct",
  "LLaVA 1.5 7B": "llava-v1-5-7b",
  "PaliGemma 3B-448": "paligemma-3b-mix-448",
  "Phi-3 Vision 128K": "phi-3-vision-128k-instruct"
},
  async fetch() {
    const source = await fetchText(FEED);
    const start = source.match(/export const LEADERBOARD_DATA\s*=\s*(?=\[)/);
    if (!start || start.index == null) throw new Error('Missing WTP-Bench standings');
    type Entry = { model: string; masterBall: number; ultraBall: number; greatBall: number; shadowBall: number };
    const rows = jsLiteral<Entry[]>(source, start.index + start[0].length);
    if (rows.length < 27) throw new Error('Missing WTP-Bench models');
    const openSection = source.split('// Open-weight')[1]?.split('];')[0];
    if (!openSection) throw new Error('Missing open-weight group');
    const openModels = new Set([...openSection.matchAll(/model:\s*"([^"]+)"/g)].map(m => m[1]));
    return rows.map(({ model,masterBall,ultraBall,greatBall,shadowBall }) => {
      if (!model || ![masterBall,ultraBall,greatBall,shadowBall].every(Number.isFinite)) throw new Error('Incomplete WTP-Bench score');
      return { model, score: masterBall, open: openModels.has(model), metrics: { ultraBall,greatBall,shadowBall } };
    });
  },
};
export default board;
