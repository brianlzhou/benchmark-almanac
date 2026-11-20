// UniGenBench: the author Space Overall leaderboard reports the whole-set score.
// The current paper is UniGenBench++, the paper linked by this catalog record.
// Only primary dimension averages remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://huggingface.co/spaces/CodeGoat24/UniGenBench_Leaderboard/resolve/main/leaderboard_data.json";
const board: Leaderboard = {
 benchmark: "unigenbench",
 parts: {
   Style: { name: 'Style', group: 'Dimension' },
   'World Knowledge': { name: 'World knowledge', group: 'Dimension' },
   'Attribute-Overall': { name: 'Attribute', group: 'Dimension' },
   'Action-Overall': { name: 'Action', group: 'Dimension' },
   'Relationship-Overall': { name: 'Relationship', group: 'Dimension' },
   'Compound-Overall': { name: 'Compound', group: 'Dimension' },
   'Grammar-Overall': { name: 'Grammar', group: 'Dimension' },
   'Layout-Overall': { name: 'Layout', group: 'Dimension' },
   'Logical Reasoning': { name: 'Logical reasoning', group: 'Dimension' },
   Text: { name: 'Text', group: 'Dimension' },
 },
 url: "https://huggingface.co/spaces/CodeGoat24/UniGenBench_Leaderboard/resolve/main/leaderboard_data.json",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const data=await fetchJson<{leaderboard:Record<string,any>[]}>(FEED);
 const keys=['Style','World Knowledge','Attribute-Overall','Action-Overall','Relationship-Overall','Compound-Overall','Grammar-Overall','Layout-Overall','Logical Reasoning','Text'];
 return checked(data.leaderboard.map(r=>({model:r.model==='GPT-4o-1.5'?'GPT-Image-1.5':r.model,score:Number(r.Overall),open:typeof r.open_source==='boolean'?r.open_source:undefined,metrics:Object.fromEntries(keys.filter(k=>Number.isFinite(r[k])).map(k=>[k,r[k]]))})),10);
 },
};
export default board;
