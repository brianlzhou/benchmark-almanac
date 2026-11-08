// iOSWorld: Overall (133) success percentage for each whole-benchmark modality.
// Single-app, multi-app and memory task scores remain metrics. The full-pass Droidrun
// protocol is a separate whole-benchmark configuration; solved counts remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://iosworld.io/leaderboard/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "iosworld",
  url: "https://iosworld.io/leaderboard/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at iosworld.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const ts=tables(await fetchText(FEED));const out:LeaderboardRow[]=[];
    const t=ts.find(t=>t[0]?.some(c=>c.text==='Modality'));if(!t)throw new Error('iOSWorld modality table missing');
    let model='';
    for(const cells of t.slice(2)){
      const r=cells.map(c=>c.text);
      if(r.length===10)model=r.shift()!.replace(/\s+(Anthropic|OpenAI|Google|Moonshot|Alibaba).*$/,'');
      if(r.length!==9)continue;
      const mode=r[0];
      for(const [i,label] of [[1,'Single (27)'],[3,'Multi (60)'],[5,'Memory (46)'],[7,'Overall (133)']] as const){const score=num(r[i]);if(score===undefined)continue;const steps=num(r[i+1]);out.push({model:identity(model),score,harness:mode,setting:label,metrics:steps===undefined?{}:{meanSteps:steps}});}
    }
    const sys=ts.find(t=>t[0]?.some(c=>c.text==='Full-pass rate'));
    for(const r of sys?.slice(1)??[]){const score=num(r[2]?.text);if(score===undefined)continue;out.push({model:r[0].text.replace(/^Droidrun · mobile-harness\s*/,'').replace(/Evaluation details$/,'').trim(),score,harness:'Droidrun · mobile-harness',setting:`Full-pass protocol; judge ${r[1].text}; ${r[3].text}`,metrics:{meanScore:num(r[4].text)!}});}
    return out.filter(r=>r.setting==='Overall (133)'||r.setting?.startsWith('Full-pass protocol')).map(r=>{
      if(r.setting==='Overall (133)')return {...r,setting:undefined,metrics:{...r.metrics,...Object.fromEntries(out.filter(x=>x.model===r.model&&x.harness===r.harness&&x!==r).flatMap(x=>{
        const key=x.setting!.split(' ')[0].toLowerCase();return [[key,x.score],...(x.metrics?.meanSteps===undefined?[]:[[key+'_steps',x.metrics.meanSteps]])];
      }))}};
      const solved=r.setting?.match(/; (\d+) \/ (\d+)$/);
      return {...r,setting:r.setting?.replace(/; \d+ \/ \d+$/,''),metrics:{...r.metrics,...(solved?{solved:Number(solved[1]),tasks:Number(solved[2])}:{})}};
    });
  },
};
export default board;
