// Pinned edition 1.1. Latest ranked runs only; question score is lower-is-better.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
const URL='https://deep20bench.com/editions/1.1/results/';
interface Row {is_latest:boolean;rank:number|null;model:{display_name:string;reasoning_effort:string};question_score:string;completed_at:string;guesser_cost_per_episode_usd:string;success_rate:string;question_score_confidence_interval:{lower:string;upper:string};contract:{compliance_rate:string}}
const board:Leaderboard={benchmark:'deep20bench-1-1',url:URL,feed:URL+' (deep20-page-state JSON)',
 terms:'Published data is CC BY 4.0; the site robots.txt permits this edition path. Software has a separate PolyForm Noncommercial license.',
 async fetch(){
  const html=await fetchText(URL);const m=html.match(/<script id="deep20-page-state" type="application\/json">([\s\S]*?)<\/script>/);
  if(!m)throw new Error('Page state missing');
  const doc=JSON.parse(m[1]).documents.find((d:{document_type:string;edition_id:string})=>d.document_type==='leaderboard'&&d.edition_id==='1.1');
  if(!doc)throw new Error('Edition 1.1 missing');
  const rows=(doc.runs as Row[]).filter(r=>r.is_latest&&r.rank!==null).map(r=>({model:r.model.display_name.replace(/ \([^)]*\)$/,''),setting:r.model.reasoning_effort,score:Number(r.question_score),date:r.completed_at.slice(0,10),cost:Number(r.guesser_cost_per_episode_usd),metrics:{solved:Number(r.success_rate)*100,compliance:Number(r.contract.compliance_rate)*100,ciLow:Number(r.question_score_confidence_interval.lower),ciHigh:Number(r.question_score_confidence_interval.upper)}}));
  if(rows.length<3||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid edition rows');return rows;
 }};export default board;
