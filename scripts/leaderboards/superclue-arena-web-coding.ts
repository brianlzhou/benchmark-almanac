// SuperCLUE Arena Web Coding ranks models by their median rating in pairwise comparisons.
// The arena page loads the ratings and confidence intervals from its board script.
import { arenaBoard } from './superclue-arena-image-editing.ts';

export default arenaBoard(
  "superclue-arena-web-coding",
  "https://www.superclueai.com/arena?type=coding&tab=webcodingboard",
  "https://www.superclueai.com/assets/VCBoard-DpojtGTk.js",
  41,
);
