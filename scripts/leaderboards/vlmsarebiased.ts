// VLMsAreBiased: counterfactual counting accuracy, in percent. Read the five-model table and the
// separate GPT-6 Astra update. Reasoning-token bins describe subsets, not mean output tokens per task;
// keep these subset scores and question counts as metrics on the overall row, never as competing scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://vlmsarebiased.github.io";
const board: Leaderboard = {
 benchmark: "vlmsarebiased", url: "https://vlmsarebiased.github.io", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 aliases: {'Sonnet-3.7':'claude-3-7-sonnet'},
 async fetch() {

const ts=tables(await fetchText(FEED));const rows:LeaderboardRow[]=[];
const t=ts.find(t=>t[0]?.some(c=>c.text==='CF mean'));if(!t)throw new Error('CF mean table missing');
const parts: NonNullable<Leaderboard['parts']> = {};
const categories = (row: NonNullable<typeof t>[number], bias = false) => {
 const metrics: Record<string, number> = {};
 for (let i = 1; i <= 7; i++) {
  const name = t[0][i].text;
  const key = name.toLowerCase();
  const score = num(row[i]?.text);
  if (score === undefined) continue;
  if (!bias) parts[key] = {name, group: 'Category'};
  metrics[bias ? key + 'BiasRate' : key] = score;
 }
 return metrics;
};
for(const r of t.slice(1)){const score=num(r[8]?.text);if(score===undefined||r[0].text==='Mean')continue;let model=r[0].text;if(model==='Gemini-2.5 Pro')model+=' [snapshot unspecified]';rows.push({model,score,setting:'Counterfactual images',metrics:{...categories(r),original:num(r[9].text)!}});}
const update=ts.find(t=>t.some(r=>r[0]?.text==='GPT-6 Astra, accuracy'));
const r=update?.find(r=>r[0]?.text==='GPT-6 Astra, accuracy');if(r){const score=num(r[8]?.text);const bias=update?.find(row=>row[0]?.text==='GPT-6 Astra, bias rate');if(score!==undefined)rows.push({model:'GPT-6 Astra',score,setting:'Counterfactual images',metrics:{...categories(r),...(bias?{...categories(bias,true),biasRate:num(bias[8].text)!}:{})}});}
const bins=ts.find(t=>t[0]?.[0]?.text==='Reasoning tokens');
if(bins)for(const r of bins.slice(1)){const score=num(r[2]?.text);if(score===undefined)continue;rows.push({model:'GPT-6 Astra',score,setting:`Reasoning token bin: ${r[0].text}`,metrics:{questions:num(r[1].text)!,biasRate:num(r[3].text)!}});}
const result: LeaderboardRow[] = rows.filter(r => r.setting === 'Counterfactual images').map(r => ({...r,setting:undefined,
 metrics:{...r.metrics,...Object.fromEntries(rows.filter(x => x.model===r.model && x.setting!.startsWith('Reasoning token bin:'))
  .flatMap(x => {const key='tokens_'+x.setting!.replace('Reasoning token bin: ','').replace(/&ndash;/g,'_').replace(/[^0-9_]+/g,'');
   parts[key] = {name:x.setting!.slice('Reasoning token bin: '.length).replace(/&ndash;/g,'–'),group:'Reasoning tokens'};
   return [[key,x.score],[key+'_questions',x.metrics!.questions],[key+'_bias',x.metrics!.biasRate]];}))}}));
const prompting = ts.find(t => t[0]?.some(c => c.text === '+ Debiased prompt'));
if (prompting) for (const r of prompting.slice(1)) {
 if (!r[0]?.text || r[0].text === 'Mean') continue;
 let model = r[0].text; if (model === 'Gemini-2.5 Pro') model += ' [snapshot unspecified]';
 for (let i = 2; i < r.length; i++) {
  const score = num(r[i].text); if (score === undefined) continue;
  result.push({model, score, setting: 'Counterfactual images; '+prompting[0][i].text, metrics: {}});
 }
}
board.parts = parts;
return result;
 },
};
export default board;
