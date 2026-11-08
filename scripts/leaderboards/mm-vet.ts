// MM-Vet: OpenCompass publishes MMVet.Overall in percent. Read the live public feed through the existing
// OpenVLM reader, preserving evaluation dates and model settings instead of dropping unlisted models.
import type { Leaderboard } from './types.ts';
import { OPENVLM_FEED, OPENVLM_TERMS, openVlmRows } from './mmbench-en-v1-1.ts';
const board: Leaderboard = {
  benchmark: 'mm-vet', url: 'https://rank.opencompass.org.cn/leaderboard-multimodal',
  feed: OPENVLM_FEED, terms: OPENVLM_TERMS,
  fetch: () => openVlmRows('MMVet'),
};
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
board.aliases = {...board.aliases, ...{"Claude3.5-Sonnet-20241022": "claude-3-5-sonnet-october-2024"}};
export default board;
