// Cummins repeats Argyle's 2016 ANES association task with 500 respondents and four models.
// The score is Pearson's r between human and simulated directed Cramer's V matrices over eleven items.
// The author's Study 2 analysis (https://osf.io/download/qcphj/) specifies complete cases, vote coding,
// the eight-item sensitivity check and the treatment of constant variables.
import type { Leaderboard } from './types.ts';
import { fetchBytes,parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://osf.io/download/vq4dt/';
const targets=['gender','race','age','education','church_goer','patriotism','discuss_politics','political_interest','vote_2016','ideology','pid7'];
type Responses = Record<string,number>;
type Respondent = {human:Responses, predicted:Responses};
type Config = {model:string, setting:string, people:Map<string,Respondent>};

// Batch complete CSV records so that the text of individual generations need not stay in memory.
function* records(csv:string) {
  const first=csv.indexOf('\n'), header=csv.slice(0,first+1);
  if (!header.includes('spec_key,respondent_id,target,model,provider,model_id') || !header.includes('predicted_code')) throw new Error('Missing generation columns');
  let start=first+1, quoted=false, count=0;
  const boundaries= /"|\n/g;
  boundaries.lastIndex=start;
  for (let m; (m=boundaries.exec(csv));) {
    if (m[0]==='"') quoted=!quoted;
    else if (!quoted && ++count===2048) {
      yield* parseCsv(header+csv.slice(start,boundaries.lastIndex));
      start=boundaries.lastIndex; count=0;
    }
  }
  if (quoted) throw new Error('Incomplete generation CSV');
  if (start<csv.length) yield* parseCsv(header+csv.slice(start));
}
function addVote(r:Responses) {
  if (r.voted_2016===0) r.vote_2016=0;
  if (r.voted_2016!==1) return;
  const choice=r.votechoice_2016;
  if ([1,2].includes(choice)) r.vote_2016=choice;
  if ([3,4,5,42].includes(choice)) r.vote_2016=3;
}
function cramer(xs:number[],ys:number[]) {
  const xIndex=new Map([...new Set(xs)].map((v,i)=>[v,i])), yIndex=new Map([...new Set(ys)].map((v,i)=>[v,i]));
  if (Math.min(xIndex.size,yIndex.size)<2) return NaN;
  const counts=Array.from({length:xIndex.size},()=>Array(yIndex.size).fill(0) as number[]);
  xs.forEach((x,i)=>{counts[xIndex.get(x)!][yIndex.get(ys[i])!]++;});
  const rows=counts.map(r=>r.reduce((s,n)=>s+n,0));
  const cols=counts[0].map((_,i)=>counts.reduce((s,r)=>s+r[i],0));
  let chi=0;
  counts.forEach((r,i)=>r.forEach((n,j)=>{
    const expected=rows[i]*cols[j]/xs.length;
    chi+=(n-expected)**2/expected;
  }));
  return Math.sqrt(chi/xs.length/Math.min(rows.length-1,cols.length-1));
}
function agreement(people:Respondent[],items:string[]) {
  const complete=people.filter(p=>items.every(t=>Number.isFinite(p.human[t]) && Number.isFinite(p.predicted[t])));
  const human=items.map(t=>complete.map(p=>p.human[t])), predicted=items.map(t=>complete.map(p=>p.predicted[t]));
  const a:number[]=[], b:number[]=[];
  for (let i=0;i<items.length;i++) for (let j=0;j<items.length;j++) {
    if (i===j) continue;
    const x=cramer(human[i],human[j]), y=cramer(human[i],predicted[j]);
    if (Number.isFinite(x) && Number.isFinite(y)) {a.push(x);b.push(y);}
  }
  const avg=(v:number[])=>v.reduce((s,n)=>s+n,0)/v.length;
  const ma=avg(a),mb=avg(b);
  const covariance=avg(a.map((v,i)=>(v-ma)*(b[i]-mb)));
  return {r:covariance/Math.sqrt(avg(a.map(x=>(x-ma)**2))*avg(b.map(y=>(y-mb)**2))),
    mae:avg(a.map((x,i)=>Math.abs(x-b[i]))), cases:complete.length, pairs:a.length};
}
const board:Leaderboard={
  benchmark:'anes-survey-item-associations',url:'https://osf.io/skbqm/',feed, host:'Jamie Cummins',static:'paper',
  terms:'Study 2 replication data on OSF. https://osf.io/skbqm/',
  parts:{sensitivity:'Excluding age, gender and race'},
  async fetch() {
    const csv=new TextDecoder().decode(await fetchBytes(feed,{},2,120_000));
    const configs=new Map<string,Config>();
    for (const r of records(csv)) {
      let c=configs.get(r.spec_key);
      if (!c) {
        const param=r.temperature && r.temperature!=='NA' ? 'Temperature '+r.temperature : 'Reasoning effort '+r.reasoning_effort;
        c={model:r.model_id,setting:[param,r.prompt_style.replaceAll('_',' '),r.info_level.replaceAll('_',' ')].join(', '),people:new Map()};
        configs.set(r.spec_key,c);
      }
      const p=c.people.get(r.respondent_id) ?? {human:{},predicted:{}};
      if (/^-?\d+$/.test(r.human_code)) p.human[r.target]=Number(r.human_code);
      if (r.valid_output==='1' && /^-?\d+$/.test(r.predicted_code)) p.predicted[r.target]=Number(r.predicted_code);
      c.people.set(r.respondent_id,p);
    }
    if (configs.size!==66) throw new Error('Expected the 66 Study 2 configurations');
    return checked([...configs.values()].flatMap(c=>{
      const people=[...c.people.values()];
      for (const p of people) {addVote(p.human);addVote(p.predicted);}
      const full=agreement(people,targets);
      if (!Number.isFinite(full.r)) return [];
      const subset=agreement(people,targets.filter(t=>!['age','gender','race'].includes(t)));
      return [{model:c.model,setting:c.setting,score:full.r,metrics:{meanAbsoluteDifference:full.mae,
        completeCases:full.cases,validPairs:full.pairs,sensitivity:subset.r,sensitivityMae:subset.mae,sensitivityCases:subset.cases}}];
    }),53);
  },
};
export default board;
