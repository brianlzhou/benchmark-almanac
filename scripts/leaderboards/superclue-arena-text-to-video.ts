// SuperCLUE Arena Text to Video ranks models by their median rating in pairwise comparisons.
// The arena page loads the ratings and confidence intervals from its board script.
import { arenaBoard } from './superclue-arena-image-editing.ts';

export default arenaBoard(
  "superclue-arena-text-to-video",
  "https://www.superclueai.com/arena?type=video&tab=board",
  "https://www.superclueai.com/assets/T2VBoard-AdwKcNFv.js",
  25,
);
