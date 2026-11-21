// SuperCLUE Arena Text to Image ranks models by their median rating in pairwise comparisons.
// The arena page loads the ratings and confidence intervals from its board script.
import { arenaBoard } from './superclue-arena-image-editing.ts';

export default arenaBoard(
  "superclue-arena-text-to-image",
  "https://www.superclueai.com/arena?type=image&tab=t2iboard",
  "https://www.superclueai.com/assets/T2IBoard-BPAweEP7.js",
  28,
);
