// SuperCLUE Arena Text to Speech ranks models by their median rating in pairwise comparisons.
// The arena page loads the ratings and confidence intervals from its board script.
import { arenaBoard } from './superclue-arena-image-editing.ts';

export default arenaBoard(
  "superclue-arena-text-to-speech",
  "https://www.superclueai.com/arena?type=audio&tab=board",
  "https://www.superclueai.com/assets/TTSBoard-CZFMxYeX.js",
  14,
);
