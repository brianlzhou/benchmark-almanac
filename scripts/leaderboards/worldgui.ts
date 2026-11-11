// WorldGUI: Overall success includes original and varied initial states. The paper publishes ten complete-system results.
// Unspecified model snapshots remain unlisted. Agent S2 retains its system name because this table does not identify its backbone.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2502.08047";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "worldgui",
  url: "https://github.com/showlab/WorldGUI",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[3];if(!t?.[0]?.some(c=>c.text==='Overall'))throw new Error('WorldGUI results changed');
    const rows:LeaderboardRow[]=[];let world=false;
    for(const r of t){if(r[0]?.text==='WorldGUI-Agent (Ours)'){world=true;continue;}if(r.length!==12||/^Human/.test(r[0].text)||num(r[11].text)===undefined)continue;
      const raw=r[0].text;let model=raw,harness:string|undefined;
      if(world){harness='WorldGUI-Agent';model=raw.replace(/^w\s*\/\s*/, '');}else if(raw.includes(' w/ ')){[harness,model]=raw.split(' w/ ');}
      model=paperModel(model);if(model==='Gemini-2.0')model+=' (model unspecified)';if(model==='Agent S2')model+=' (backbone unspecified)';if(model==='UI-TARS-1.5')model+=' (size unspecified)';
      rows.push({model,harness,score:num(r[11].text)!});
    }if(rows.length!==10)throw new Error('WorldGUI expected ten systems');return rows;
  },
};
export default board;
