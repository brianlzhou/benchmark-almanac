// GeoDrive-Bench evaluates driving-scene and traffic-rule questions in six countries.
// The authors' full results table gives three prompting protocols and 24 category-country accuracies.
// Its caption defines Overall as "the mean across all cells."
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/gray311/CulturalDrive-Bench/HEAD/eval/tables/results_full_all.tex';
const groups = ['Perception','Prediction','Planning','Region'];
const countries = ['CN','US','UK','JP','SG','IND'];
const keys = groups.flatMap(group => countries.map(country => group+': '+country));
const board: Leaderboard = {
  benchmark:'geodrive-bench', url:'https://github.com/gray311/CulturalDrive-Bench', feed,
  terms:'The authors license the repository code under MIT. https://github.com/gray311/CulturalDrive-Bench#license',
  parts:Object.fromEntries(keys.map(k=>[k,k])),
  aliases:{'LLaVA-1.6-7B':'llava-v1-6-mistral-7b','Qwen3-VL-8B':'qwen3-vl-8b-instruct',
    'Llama-3.2-11B-V':'llama-3-2-11b','Qwen3-VL-235B':'qwen3-vl-235b-a22b'},
  async fetch() {
    const tex = await fetchText(feed);
    if (!tex.includes('{tab:results_full_all}') || !tex.includes('{Overall}') ||
      !groups.every(g=>tex.includes('{6}{c|}{'+g+'}')) || !tex.includes(Array(4).fill(countries.join(' & ')).join(' & ')))
      throw new Error('GeoDrive results columns changed');
    const rows: LeaderboardRow[] = [];
    let model = '';
    for (const line of tex.split('\n')) {
      const cells = line.replace(/\\textbf\{([^{}]+)\}/g,'$1').replace(/\\\\\s*$/,'').split('&').map(s=>s.trim());
      if (!['Direct','Reasoning','Rule-Given'].includes(cells[1])) continue;
      if (cells[0]) model = cells[0].match(/^\\multirow\{3\}\{\*\}\{([^}]+)\}$/)?.[1] ?? '';
      if (!model || cells.length !== 27) throw new Error('Invalid GeoDrive model row');
      rows.push({model,setting:cells[1],score:numberCell(cells[26]),
        metrics:Object.fromEntries(keys.map((k,i)=>[k,numberCell(cells[i+2])]))});
    }
    return checked(rows,27);
  },
};
export default board;
