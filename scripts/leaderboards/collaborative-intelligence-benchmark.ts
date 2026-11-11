// Collaborative Intelligence 4.0.0 scores team tests on scenarios passed alone, averaged over eight dimensions. Preserve high versus minimum effort, public/private splits, confidence intervals and dimension scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const FEED = "https://zou-group.github.io/collaborative-intelligence/data/leaderboard_v4.json";
const board: Leaderboard = {
  benchmark: "collaborative-intelligence-benchmark", url: "https://zou-group.github.io/collaborative-intelligence/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const d=JSON.parse(source);for(const r of d.models){if(typeof r.score!=="number")continue;const metrics:Record<string,number>={ciLow:r.ci[0],ciHigh:r.ci[1],public:r.public,private:r.private,baseline:r.baseline,alone:r.alone};for(const [key,v] of Object.entries(r.dims) as [string,any][])if(typeof v.test==="number")metrics[key]=v.test;rows.push({model:r.name,score:r.score,setting:`v${d.version}; ${r.high?"high":"minimum"} reasoning effort`,metrics});}
    if (!rows.length) throw new Error("No collaborative-intelligence-benchmark score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

