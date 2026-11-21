// SuperCLUE Arena Reference to Video ranks models by their median rating in pairwise comparisons.
// The arena page loads the ratings and confidence intervals from its board script.
import { arenaBoard } from './superclue-arena-image-editing.ts';

export default arenaBoard(
  "superclue-arena-reference-to-video",
  "https://www.superclueai.com/arena?type=video&tab=r2vboard",
  "https://www.superclueai.com/assets/R2VBoard-U_Um-Vtz.js",
  12,
);
