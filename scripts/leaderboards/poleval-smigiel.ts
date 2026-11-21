// PolEval ranks machine-text detectors by accuracy. Each track changes the allowed training resources for the same detection task.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { polevalRanking } from "./poleval-2025-gender-inclusive-proofreading.ts";
const board: Leaderboard = {
  benchmark: "poleval-smigiel",
  url: "https://2025.poleval.pl/results/",
  feed: "https://2025.poleval.pl/results/",
  terms: "The organizers publish medalists by task. The page gives no separate license for standings. https://2025.poleval.pl/results/ The PolEval results path is allowed by robots.txt.",
  async fetch() {
    const page = await fetchText(this.url);
    return [['1a','Unsupervised',2],['1b','Constrained',3],['1c','Open',1]].flatMap(([track,setting,min]) =>
      polevalRanking(page,'task-'+track+'-śmigiel-'+String(setting).toLowerCase(),Number(min)).map(r=>({...r,setting:String(setting)}))); 
  },
};
export default board;
