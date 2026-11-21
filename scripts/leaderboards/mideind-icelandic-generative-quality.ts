// Miðeind measures grammatical and vocabulary quality in generated Icelandic paragraphs. Its public JSON gives both components and their combined score.
import type { Leaderboard } from './types.ts';
import { mideindRows } from './icelandic-wikiqa.ts';

const FEED = "https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/leaderboard.json";
const board: Leaderboard = {
  benchmark: "mideind-icelandic-generative-quality",
  url: "https://mideind-icelandic-llm-leaderboard.static.hf.space/",
  feed: FEED,
  terms: "generative_quality@v1 uses a 0 to 1 scale in the feed. The 102 configurations cover 60 model names. Credit Miðeind under CC BY 4.0. https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/blob/main/README.md The robots file allows this feed for the importer.",
  parts: { grammar: 'Grammar', vocabulary: 'Vocabulary' },
  async fetch() {
    return mideindRows('generative_quality@v1', 'quality_score', { grammar: 'grammar', vocabulary: 'vocabulary' });
  },
};
export default board;
