// SuperCLUE Arena Image to Video ranks models by their median rating in pairwise comparisons.
// The arena page loads the ratings and confidence intervals from its board script.
import { arenaBoard } from './superclue-arena-image-editing.ts';

export default arenaBoard(
  "superclue-arena-image-to-video",
  "https://www.superclueai.com/arena?type=video&tab=image2videoboard",
  "https://www.superclueai.com/assets/I2VBoard-XycoFrDa.js",
  25,
);
