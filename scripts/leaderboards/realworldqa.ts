// AGI-Eval measures accuracy on RealWorldQA in its image and text understanding comparison.
// Read the scored RealWorldQA column from the latest public table through the shared AGI-Eval reader.
import type { Leaderboard } from './types.ts';
import { agiApi, agiRows, agiTerms } from './gsm8k.ts';

const board: Leaderboard = {
  benchmark: 'realworldqa', host: 'AGI-Eval', terms: agiTerms, feed: agiApi + 'dataList',
  url: 'https://agi-eval.org/topRanking?modality=MULTIMODAL_MODEL&modelType=IMAGE_TEXT_UNDERSTANDING&rankType=PUBLIC',
  aliases: { 'GPT4-turbo-0409': 'gpt-4-turbo-apr-2024',
    'Claude-3.5-Sonnet-20241022': 'claude-3-5-sonnet-october-2024' },
  fetch: () => agiRows('MULTIMODAL_MODEL', 'IMAGE_TEXT_UNDERSTANDING', 'realworldQA', 10),
};
export default board;
