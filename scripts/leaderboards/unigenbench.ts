// UniGenBench: the author Space Overall leaderboard reports the whole-set score.
// The current paper is UniGenBench++, the paper linked by this catalog record.
// Keep the dimension averages and their individual categories.
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
   quantity: {name: 'Quantity', group: 'Attribute'}, expression: {name: 'Expression', group: 'Attribute'}, material: {name: 'Material', group: 'Attribute'}, size: {name: 'Size', group: 'Attribute'}, shape: {name: 'Shape', group: 'Attribute'}, color: {name: 'Color', group: 'Attribute'},
   hand: {name: 'Hand', group: 'Action'}, fullBody: {name: 'Full body', group: 'Action'}, animal: {name: 'Animal', group: 'Action'}, nonContact: {name: 'Non contact', group: 'Action'}, contact: {name: 'Contact', group: 'Action'}, state: {name: 'State', group: 'Action'},
   composition: {name: 'Composition', group: 'Relationship'}, similarity: {name: 'Similarity', group: 'Relationship'}, inclusion: {name: 'Inclusion', group: 'Relationship'}, comparison: {name: 'Comparison', group: 'Relationship'}, imagination: {name: 'Imagination', group: 'Compound'}, featureMatching: {name: 'Feature matching', group: 'Compound'}, pronounReference: {name: 'Pronoun reference', group: 'Grammar'}, consistency: {name: 'Consistency', group: 'Grammar'}, negation: {name: 'Negation', group: 'Grammar'}, '2d': {name: '2D', group: 'Layout'}, '3d': {name: '3D', group: 'Layout'},
 },
 url: "https://huggingface.co/spaces/CodeGoat24/UniGenBench_Leaderboard/resolve/main/leaderboard_data.json",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const data=await fetchJson<{leaderboard:Record<string,any>[]}>(FEED);
 const categories: Record<string, string[]> = {
   Attribute: ['Quantity', 'Expression', 'Material', 'Size', 'Shape', 'Color'],
   Action: ['Hand', 'Full body', 'Animal', 'Non Contact', 'Contact', 'State'],
   Relationship: ['Composition', 'Similarity', 'Inclusion', 'Comparison'],
   Compound: ['Imagination', 'Feature matching'], Grammar: ['Pronoun Reference', 'Consistency', 'Negation'],
   Layout: ['2D', '3D'],
 };
 const extra = Object.entries(categories).flatMap(([group, names]) => names.map(name => {
   const key = name.toLowerCase().replace(/ (.)/g, (_, c: string) => c.toUpperCase());
   board.parts![key] = {name, group};
   return {key, name};
 }));
 const keys=['Style','World Knowledge','Attribute-Overall','Action-Overall','Relationship-Overall','Compound-Overall','Grammar-Overall','Layout-Overall','Logical Reasoning','Text'];
 return checked(data.leaderboard.map(r=>({model:r.model==='GPT-4o-1.5'?'GPT-Image-1.5':r.model,score:Number(r.Overall),open:typeof r.open_source==='boolean'?r.open_source:undefined,metrics:Object.fromEntries([...keys.filter(k=>Number.isFinite(r[k])).map(k=>[k,r[k]]), ...extra.filter(({name})=>Number.isFinite(r[name])).map(({key,name})=>[key,r[name]])])})),10);
 },
};
export default board;
