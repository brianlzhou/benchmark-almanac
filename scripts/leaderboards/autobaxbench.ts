// AutoBaxBench ranks correct-and-secure pass@1. Convert its 0-1 fraction to percent and retain correctness and insecure-among-correct metrics. Use the board’s default Easy view, as selected by static/js/index.js.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://baxbench.com/static/data/leaderboard_data_abb_easy.json";
const board: Leaderboard = {
  benchmark: "autobaxbench", url: "https://baxbench.com/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for(const split of ["easy"]){const data=JSON.parse(split==="easy"?source:await fetchText(FEED.replace("_easy.json",`_${split}.json`)));for(const r of data){if(typeof r.sec_pass_1!=="number")continue;rows.push({model:r.model.replace(/\s*\*$/, ""),score:r.sec_pass_1*100,metrics:{usedForTaskGeneration:r.model.includes("*")?1:0,pass1:r.pass_1*100,insecureAmongCorrect:r.insec_pass}});}}
    if (!rows.length) throw new Error("No autobaxbench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
export default board;

