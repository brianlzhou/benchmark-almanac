// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// JOKER Task 4 ranks generated puns by Bradley-Terry rating in English, Spanish and French.
// Section 5 of the overview identifies the backbones and settings behind the leaderboard's abbreviated run IDs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = 'https://www.joker-project.com/2026/leaderboards/task4_leaderboard_all.csv';
const languages = ['en','es','fr'];
const ubo: Record<string,string> = {gemini:'Gemini-3-flash',qwen:'Qwen3-4B',mistral:'Mistral-7B (instruction-tuned, version unspecified)',gemma:'Gemma-2-9B-it',llama:'Llama-3.1-8B-Instruct'};
function entrant(team: string, run: string) {
  if (team === 'jayi2525') {
    const name = run.replace('SaLT_task4_', '');
    if (name === 'KimiCSF') return {model:'Kimi-K2.6', submitter:'SaLT', harness:'Cognitive Synergy Framework'};
    if (name === 'KimiPlain') return {model:'Kimi-K2.6', submitter:'SaLT', setting:'Direct zero-shot'};
    const size = name.match(/^HumorGen(14B|32B)$/)?.[1];
    if (size) return {model:'HumorGen-JOKER-'+size, submitter:'SaLT'};
  }
  if (team === 'liana87' && run.endsWith('_pun')) {
    const family = run.match(/^UBO_task3_+(gemini|qwen|mistral|gemma|llama)/)?.[1];
    if (family) return {model:ubo[family], submitter:'UBO', setting:'Pun prompt'};
  }
  if (team === 'ezrasmink' && run.startsWith('UAms_task4_')) return {model:run.slice('UAms_task4_'.length),submitter:'UAms',harness:'Humor detection and pun reranking'};
}
const board: Leaderboard = {
  benchmark:'clef-joker-2026-humor-generation',url:'https://www.joker-project.com/2026/leaderboards/',feed,
  terms:'The JOKER lab publishes the final results at https://www.joker-project.com/2026/leaderboards/. Source attribution applies.',
  parts:{en:'English', es:'Spanish', fr:'French'},
  stats:{
    enBattles:{name:'English battles',unit:'count'},
    esBattles:{name:'Spanish battles',unit:'count'},
    frBattles:{name:'French battles',unit:'count'},
  },
  async fetch() {
    const runs = new Map<string,LeaderboardRow>();
    for (const item of parseCsv(await fetchText(feed))) {
      const entry = entrant(item.team, item.run_id);
      if (!entry) continue;
      const lang = item.track;
      if (!languages.includes(lang)) throw new Error('Unknown language ' + lang);
      const key = JSON.stringify(entry);
      const row = runs.get(key) ?? {...entry,score:0,metrics:{}};
      const metrics = row.metrics!;
      if (lang in metrics) throw new Error('Duplicate rating for '+key);
      for (const [column,suffix] of [['bt_rating',''],['ci_low_95','Low'],['ci_high_95','High'],['n_battles','Battles']]) {
        if (!/^-?\d+(?:\.\d+)?$/.test(item[column])) throw new Error('Missing '+column);
        metrics[lang+suffix] = Number(item[column]);
      }
      runs.set(key,row);
    }
    const rows = [...runs.values()].filter(r=>languages.every(l=>l in r.metrics!));
    for (const row of rows) row.score = languages.reduce((sum,l)=>sum+row.metrics![l],0)/3;
    return checked(rows,12);
  },
};
export default board;
