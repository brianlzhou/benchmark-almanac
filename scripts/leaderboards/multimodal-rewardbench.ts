// Multimodal RewardBench measures preference agreement. The repository's leaderboard gives overall accuracy and six categories as fractions.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { markdownTables } from "../lib/boards/github-markdown.ts";
const board: Leaderboard = {
  benchmark: "multimodal-rewardbench",
  url: "https://github.com/facebookresearch/multimodal_rewardbench",
  feed: "https://raw.githubusercontent.com/facebookresearch/multimodal_rewardbench/HEAD/README.md",
  terms: "The repository describes dataset and third-party licenses. The raw GitHub host returned 404 for robots.txt.",
  async fetch() {
    const t = markdownTables(await fetchText(this.feed)).find(t => t[0][0]==='Model' && t[0][1]==='Overall');
    if (!t || t.length < 9 || t[0].length !== 8) throw new Error('Incomplete Multimodal RewardBench table');
    const parts = t[0].slice(2);
    this.parts = Object.fromEntries(parts.map(p=>[p,p]));
    return t.slice(1).map(r => {
      const values = r.slice(1).map(x => /^0?\.\d+$|^[01]$/.test(x)?100*Number(x):NaN);
      if (!r[0] || values.length!==7 || !values.every(Number.isFinite)) throw new Error('Invalid reward score');
      return {model:r[0],score:values[0],metrics:Object.fromEntries(parts.map((p,i)=>[p,values[i+1]]))};
    });
  },
};
export default board;
