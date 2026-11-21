// DataPrep-Bench reports six domain averages for generated data. Backbone choice is a run configuration within each domain.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, num, text } from '../html.ts';

const FEED = "https://datapreparationbench.github.io/";
const DATAPREP_LABELS: Record<string, { name: string; unit: string; better: 'higher' }> = {
 GSM8K_1:{name:'GSM8K',unit:'%',better:'higher'},AMC23_2:{name:'AMC23',unit:'%',better:'higher'},AIME24_3:{name:'AIME24',unit:'%',better:'higher'},'M-Math_4':{name:'M-Math',unit:'%',better:'higher'},OB_5:{name:'OlympiadBench',unit:'%',better:'higher'},M500_6:{name:'MATH-500',unit:'%',better:'higher'},GK24_7:{name:'Gaokao 2024',unit:'%',better:'higher'},Avg_8:{name:'Math benchmark average',unit:'%',better:'higher'},'MMLU-R_9':{name:'MMLU-R',unit:'%',better:'higher'},Avg_10:{name:'General benchmark average',unit:'%',better:'higher'},'CPA-KQA_11':{name:'CPA-KQA',unit:'%',better:'higher'},'FinEval-KR_12':{name:'FinEval-KR',unit:'%',better:'higher'},XFinBench_13:{name:'XFinBench',unit:'%',better:'higher'},Avg_14:{name:'Finance benchmark average',unit:'%',better:'higher'},LegalBench_1:{name:'LegalBench',unit:'%',better:'higher'},LexGLUE_2:{name:'LexGLUE',unit:'%',better:'higher'},Avg_3:{name:'Law benchmark average',unit:'%',better:'higher'},'MedCaseR._4':{name:'MedCaseReasoning',unit:'%',better:'higher'},MedMCQA_5:{name:'MedMCQA',unit:'%',better:'higher'},'MedR-Bench_6':{name:'MedR-Bench',unit:'%',better:'higher'},Avg_7:{name:'Medical benchmark average',unit:'%',better:'higher'},'MMLU-STEM_8':{name:'MMLU-STEM',unit:'%',better:'higher'},'MMLU-Pro_9':{name:'MMLU-Pro',unit:'%',better:'higher'},GPQA_10:{name:'GPQA',unit:'%',better:'higher'},SuperGPQA_11:{name:'SuperGPQA',unit:'%',better:'higher'},ChemBench_12:{name:'ChemBench',unit:'%',better:'higher'},PIQA_13:{name:'PIQA',unit:'%',better:'higher'},SciBench_14:{name:'SciBench',unit:'%',better:'higher'},Avg_15:{name:'Science benchmark average',unit:'%',better:'higher'},
};
export const dataprepStats = (parts: string[], only?: string[]) => Object.fromEntries(Object.entries(DATAPREP_LABELS).filter(([key]) => (!only || only.includes(key)) && !parts.includes(key))) as Leaderboard['stats'];
const board: Leaderboard = {
 benchmark: "dataprep-bench", url: "https://datapreparationbench.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const ts=tables(await fetchText(FEED));const rows:LeaderboardRow[]=[];
 for(let ti=1;ti<=4;ti++){const t=ts[ti];if(t?.[0]?.[0]?.text!=='Generator')throw new Error('Missing construction table');const backbone=ti<=2?'Qwen2.5-7B':'Llama-3.1-8B';let family='';
 for(const r of t.slice(2)){if(r.length<=2){family=r[0].text;continue;}if(r[0].text==='No synthetic training')continue;
 let model=r[0].text;let harness=family;if(model.startsWith('Skill (')){model=model.slice(7,-1);harness='Data-Construction-Skill';}if(model==='Gemini 3.0 Pro')model+=' [snapshot unspecified]';
 const specs: [string,number][] = ti%2? [['Math',8],['General',10],['Finance',14]]:[['Law',3],['Medical',7],['Science',15]];
 const metrics=Object.fromEntries(r.slice(1).flatMap((c,i)=>{const v=num(c.text);return v===undefined?[]:[[`${t[1][i]?.text??'column'}_${i+1}`,v]];}));
 for(const [domain,col] of specs){const score=num(r[col]?.text);if(score!==undefined)rows.push({model,harness,score,setting:`${backbone}; ${domain}; downstream average`,metrics});}}}
 return rows;
 },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
