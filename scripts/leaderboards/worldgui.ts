// WorldGUI: Overall success includes original and varied initial states. The paper publishes ten complete-system results.
// Unspecified model snapshots remain unlisted. Agent S2 retains its system name because this table does not identify its backbone.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2502.08047";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "worldgui", static: 'paper',
  url: "https://github.com/showlab/WorldGUI",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const published=await paperTables(FEED);
    const t=published[3];if(!t?.[0]?.some(c=>c.text==='Overall'))throw new Error('WorldGUI results changed');
    const rows:LeaderboardRow[]=[];let world=false;
    for(const r of t){if(r[0]?.text==='WorldGUI-Agent (Ours)'){world=true;continue;}if(r.length!==12||/^Human/.test(r[0].text)||num(r[11].text)===undefined)continue;
      const raw=r[0].text;let model=raw,harness:string|undefined;
      if(world){harness='WorldGUI-Agent';model=raw.replace(/^w\s*\/\s*/, '');}else if(raw.includes(' w/ ')){[harness,model]=raw.split(' w/ ');}
      model=paperModel(model);if(model==='Gemini-2.0')model+=' (model unspecified)';if(model==='Agent S2')model+=' (backbone unspecified)';if(model==='UI-TARS-1.5')model+=' (size unspecified)';
      const metrics: Record<string,number> = {};
      const parts = board.parts ??= {};
      for (let i=0; i<5; i++) {
        const group = t[0][i+1].text;
        const prefix = group.toLowerCase().replace(/[^a-z]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '');
        for (const [j,name] of ['Meta','Augmented'].entries()) {
          const key = prefix + name;
          metrics[key] = num(r[1+2*i+j].text)!;
          parts[key] = {name, group};
        }
      }
      if (world && model === 'GPT-5.1') {
        const breakdown = published.find(table => table[0]?.[0]?.text === 'Augmentation Type');
        for (const row of breakdown?.slice(1) ?? []) {
          const name = row[0].text;
          const key = name === 'Total' ? 'augmented' : name.toLowerCase().replace(/-(.)/g,(_,c:string)=>c.toUpperCase());
          const value = num(row[2]?.text);
          if (value === undefined) continue;
          metrics[key] = value;
          metrics[key+'Tasks'] = num(row[1].text)!;
          metrics[key+'Successes'] = num(row[3].text)!;
          parts[key] = {name:name === 'Total' ? 'All augmented tasks' : name, group:'Augmentation type'};
        }
      }
      rows.push({model,harness,score:num(r[11].text)!,metrics});
    }if(rows.length!==10)throw new Error('WorldGUI expected ten systems');return rows;
  },
};
export default board;
