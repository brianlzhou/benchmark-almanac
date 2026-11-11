// StereoSet: use the published overall ICAT composite. Sentence-type and bias-category ICAT scores
// remain metrics alongside the overall language-model and stereotype scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/moinnadeem/StereoSet/master/code/predictions.txt";
const board: Leaderboard = {
  benchmark: "stereoset", url: "https://github.com/moinnadeem/StereoSet", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    let model="",split="",category="",metrics:Record<string,number>={};for(const line of source.split(/\r?\n/)){const start=line.match(/^Evaluating predictions\/predictions_(.+)\.json/);if(start){model=start[1];continue;}if(/^(intrasentence|intersentence|overall)$/.test(line)){split=line;category="";metrics={};continue;}if(/^\t[^\t:]+$/.test(line)){category=line.trim();metrics={};continue;}const m=line.match(/^\s+(Count|LM Score|SS Score|ICAT Score): ([\d.]+)/);if(!m)continue;metrics[m[1]]=Number(m[2]);if(m[1]==="ICAT Score")rows.push({model,score:Number(m[2]),setting:[split,category].filter(Boolean).join("; "),metrics:{...metrics}});}
    if (!rows.length) throw new Error("No stereoset score rows");
    return rows.filter(r => r.setting === 'overall').map(r => ({...r, setting:undefined,
      metrics: {...r.metrics, ...Object.fromEntries(rows.filter(x => x.model === r.model && x !== r)
        .map(x => [x.setting!.replace(/; /g,'_'), x.score]))}}));
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

