// LMBuild: the default leaderboard ranks the all-task Mean, in percent.
// The official app.js defines it as "r.scores.reduce((a, b) => a + b, 0) / 12".
// As on the page, incomplete twelve-metric submissions have no overall score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const FEED = "https://lumos-jiateng.github.io/LMBuild/data/results.json";
const board: Leaderboard = {
  benchmark: "lmbuild", parts: {
  '1.1': { name: 'Connectivity', group: 'Dimension', note: 'Soundness component of the 12-score mean.' },
  '1.2': { name: 'Collision', group: 'Dimension', note: 'Soundness component of the 12-score mean.' },
  '1.3': { name: 'Stability', group: 'Dimension', note: 'Soundness component of the 12-score mean.' },
  '2.1': { name: 'Geometry', group: 'Dimension', note: 'Affordance component of the 12-score mean.' },
  '2.2': { name: 'Parts', group: 'Dimension', note: 'Affordance component of the 12-score mean.' },
  '2.3': { name: 'Kinematics', group: 'Dimension', note: 'Affordance component of the 12-score mean.' },
  '3.1': { name: 'Decomposition', group: 'Dimension', note: 'Design component of the 12-score mean.' },
  '3.2': { name: 'Aesthetics', group: 'Dimension', note: 'Design component of the 12-score mean.' },
  '3.3': { name: 'Alignment', group: 'Dimension', note: 'Design component of the 12-score mean.' },
  'P.1': { name: 'Sequence', group: 'Dimension', note: 'Realization component of the 12-score mean.' },
  'P.2': { name: 'Material', group: 'Dimension', note: 'Realization component of the 12-score mean.' },
  'P.3': { name: 'Operability', group: 'Dimension', note: 'Realization component of the 12-score mean.' },
}, url: "https://lumos-jiateng.github.io/LMBuild/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const d=JSON.parse(source);
    if(d.metrics.length!==12)throw new Error('LMBuild mean definition changed');
    for(const r of d.rows){
      if(r.scores?.length!==12||!r.scores.every((v:unknown)=>typeof v==='number'&&Number.isFinite(v)))continue;
      rows.push({model:r.id,score:r.scores.reduce((a:number,b:number)=>a+b,0)/12,
        harness:r.group==='ext'?r.name:undefined,
        metrics:Object.fromEntries(d.metrics.map((k:string,i:number)=>[k,r.scores[i]]))});
    }
    if (!rows.length) throw new Error("No lmbuild score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

