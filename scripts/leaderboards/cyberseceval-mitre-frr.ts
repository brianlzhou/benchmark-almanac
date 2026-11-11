// CyberSecEval MITRE helpfulness reports refusal and violation fractions. False refusal is the headline, converted to percent; retain violation percent as a separate metric and leave latest aliases unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const FEED = "https://huggingface.co/spaces/facebook/CyberSecEval/raw/main/trr_frr_tradeoff_helpfulness.json";
const board: Leaderboard = {
  benchmark: "cyberseceval-mitre-frr", url: "https://huggingface.co/spaces/facebook/CyberSecEval", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for(const [model,v] of Object.entries(JSON.parse(source)) as [string,any][]){if(typeof v["Refusal Rate"]!=="number")continue;rows.push({model:model.endsWith("-latest")?`${model} (snapshot unspecified)`:model,score:v["Refusal Rate"]*100,metrics:{violationRate:v["Violation Rate"]*100}});}
    if (!rows.length) throw new Error("No cyberseceval-mitre-frr score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

