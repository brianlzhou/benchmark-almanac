// Video-SafetyBench: the Overall RJScore is the paper headline harm score on a 0 to 4 scale, lower is better.
// The catalog needs unit score rather than percent. Harmful and benign-looking queries are whole-set prompt modes.
// Overall ASR and category ASRs remain metrics. This importer must wait for the catalog correction.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2505.11842";
const board: Leaderboard = {
 benchmark: "video-safetybench", static: 'paper',
 url: "https://arxiv.org/html/2505.11842",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",
 stats: {asr:{name:'Attack success rate',unit:'%',better:'lower'},VC:{name:'Violence and cruelty',unit:'score',better:'lower'},NC:{name:'Non-consensual content',unit:'score',better:'lower'},SC:{name:'Sexual content',unit:'score',better:'lower'},CSE:{name:'Child sexual exploitation',unit:'score',better:'lower'},Def:{name:'Defamation',unit:'score',better:'lower'},SA:{name:'Self-harm',unit:'score',better:'lower'},Pvy:{name:'Privacy',unit:'score',better:'lower'},IP:{name:'Intellectual property',unit:'score',better:'lower'},IW:{name:'Illegal weapons',unit:'score',better:'lower'},Hate:{name:'Hate',unit:'score',better:'lower'},SSh:{name:'Sexual harassment',unit:'score',better:'lower'},SCrime:{name:'Serious crime',unit:'score',better:'lower'},Elec:{name:'Election manipulation',unit:'score',better:'lower'}},

 async fetch(): Promise<LeaderboardRow[]> {
const raw=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Query Type')&&t[1]?.some(c=>c.text==='RJScore'));
 if(!raw)throw new Error('Video-SafetyBench table missing');
 const t=grid(raw);
 const openness=new Map<string,boolean>();let open:boolean|undefined;
 for(const r of t){if(/Proprietary Video LVLMs/.test(r[0]))open=false;else if(/Open.source Video LVLMs/i.test(r[0]))open=true;else if(['Harm.','Ben.'].includes(r[1])&&open!==undefined)openness.set(r[0],open);}
 return checked(t.filter(r=>r.length===17&&['Harm.','Ben.'].includes(r[1])).map(r=>({model:r[0].replace(/\s*\[\d+\]/g,''),setting:r[1]==='Harm.'?'harmful queries':'benign-looking queries',score:num(r[16])!,open:openness.get(r[0]),metrics:{asr:num(r[15])!,...Object.fromEntries(['VC','NC','SC','CSE','Def','SA','Pvy','IP','IW','Hate','SSh','SCrime','Elec'].map((k,i)=>[k,num(r[i+2])!]))}})),48);
 },
};
export default board;
