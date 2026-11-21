// BenchMAX tests multilingual capabilities. The authors' results CSVs report different metrics for each task.
// The first task is rule-based instruction following. Its headline is the published average across 17 languages,
// expressed on the 0 to 100 scale of the authors' main results table.
import type { Leaderboard, BoardPart, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'https://github.com/CONE-MT/BenchMAX';
const base = 'https://raw.githubusercontent.com/CONE-MT/BenchMAX/HEAD/results/';
const tasks: [string,string,number][] = [
  ['rule_based','Rule-based instruction following',100], ['model_based','Model-based instruction following',1],
  ['func_compl','Function completion',100], ['prob_solving','Problem solving',100], ['math','Math',100], ['science','Science',100],
  ['long_context','Question answering',1], ['tool_use','Multiple functions',1],
  ['general_trans','General translation',1], ['domain_trans_avg','Domain translation',1],
];
const languageCodes = ['en','cs','de','es','fr','ru','sr','bn','zh','ja','ko','ar','th','hu','vi','sw','te'];
const translationPairs = ['cs','de','es','fr','ru','sr','bn','zh','ja','ko','ar','th','hu','vi','sw','te'];
const staticParts: Record<string,BoardPart> = {};
for (const [file,title] of tasks) {
  if (file === 'general_trans') {
    for (const direction of ['En to X','X to En']) {
      const key = `General translation: ${direction}`;
      staticParts[key] = { name: key, unit: 'score' };
      for (const lang of translationPairs) staticParts[`${key}: ${direction === 'En to X' ? 'en->' + lang : lang + '->en'}`] = { name: `${key}: ${direction === 'En to X' ? 'en to ' + lang : lang + ' to en'}`, unit: 'score' };
    }
  } else if (file === 'domain_trans_avg') {
    for (const metric of ['En to X spBLEU','X to En spBLEU','En to X TER','X to En TER','En to X xComet','X to En xComet']) {
      const key = `Domain translation: ${metric}`;
      staticParts[key] = { name: key, unit: 'score', ...(metric.endsWith('TER') ? { better: 'lower' as const } : { better: 'higher' as const }) };
      for (const lang of translationPairs) {
        const pair = metric.startsWith('En') ? `en->${lang}` : `${lang}->en`;
        staticParts[`${key}: ${pair}`] = { name: `${key}: ${pair.replace('->',' to ')}`, unit: 'score', ...(metric.endsWith('TER') ? { better: 'lower' as const } : { better: 'higher' as const }) };
      }
    }
  } else {
    const key = title;
    staticParts[key] = { name: key, unit: file === 'model_based' ? '%' : '%' };
    for (const lang of languageCodes) staticParts[`${key}: ${lang}`] = { name: `${key}: ${lang}`, unit: '%' };
  }
}

const board: Leaderboard = {
  benchmark: 'benchmax', url: repo, feed: base + 'rule_based.csv',
  terms: 'MIT license at https://github.com/CONE-MT/BenchMAX/blob/HEAD/LICENSE.',
  headline: 'The authors report no overall score. The headline is rule-based instruction following, the first task in their main table.',
  parts: staticParts,
  aliases: { 'DeepSeek-V3 671B':'deepseek-v3', 'InternLM2.5 20B':'internlm2-5-20b-chat', 'gpt-4o-mini-2024-07-18':'gpt-4o-mini', 'gpt-4o-2024-08-06':'gpt-4o-aug-2024' },
  async fetch() {
    const results = new Map<string,LeaderboardRow>();
    const parts: Record<string,BoardPart> = {};
    for (const [file,title,factor] of tasks) {
      if (results.size) await new Promise(resolve => setTimeout(resolve,1000));
      const lines = (await fetchText(base+file+'.csv')).replace(/^\uFEFF/,'').split(/\r?\n/);
      const starts = lines.flatMap((line,i) => line.split(',')[1] === 'Size' ? [i] : []);
      if (!starts.length) throw new Error('Missing Size header in '+file);
      for (const [index,start] of starts.entries()) {
        const lineset = lines.slice(start,starts[index+1] ?? lines.length);
        const columns = lineset[0].split(',');
        const avg = columns.find(k => k.toLowerCase() === 'avg');
        if (!avg) throw new Error('Missing language average in '+file);
        const part = [title,columns[0]].filter(Boolean).join(': ').replace('->',' to ');
        const translation = file.includes('trans');
        parts[part] = { name:part, unit:translation ? 'score' : '%', ...(part.endsWith(' TER') ? {better:'lower' as const} : {}) };
        if (!translation && !columns.includes('en')) throw new Error('Missing English column in '+file);
        columns[0] = 'Model';
        lineset[0] = columns.join(',');
        let count = 0;
        for (const cell of parseCsv(lineset.join('\n'))) {
          if (cell.Size === 'ctx_length') break;
          if (!cell.Model?.trim() || !cell[avg]?.trim()) continue;
          const model = [cell.Model,cell.Size?.replace('37B/671B','671B')].filter(Boolean).join(' ');
          const value = Number(cell[avg])*factor;
          if (!Number.isFinite(value)) throw new Error('Invalid '+file+' average for '+model);
          if (file === 'rule_based') results.set(model,{model,score:value,metrics:{}});
          const row = results.get(model);
          if (!row) continue;
          row.metrics![part] = value;
          for (const lang of columns.slice(2,columns.indexOf(avg))) {
            const n = cell[lang]?.trim();
            if (n && Number.isFinite(Number(n))) row.metrics![part+': '+lang] = Number(n)*factor;
          }
          if (file === 'rule_based') row.metrics!.std = Number(cell.STD)*factor;
          count++;
        }
        if (!count) throw new Error('No results for '+part);
      }
    }
    board.parts = parts;
    return checked([...results.values()],24);
  },
};
export default board;
