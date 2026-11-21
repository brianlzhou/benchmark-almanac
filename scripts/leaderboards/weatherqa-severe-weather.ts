// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// WeatherQA tests affected-area identification and severe weather classification given correct area identification.
// The project README reports both tasks and an additional image-count experiment on QwenVL2.5-7B.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const repo = 'https://github.com/chengqianma/WeatherQA';
const feed = 'https://raw.githubusercontent.com/chengqianma/WeatherQA/main/README.md';
function accuracy(s: string) {
  if (!/^\d+(?:\.\d+)?%$/.test(s)) throw new Error('Invalid accuracy: '+s);
  return parseFloat(s);
}
const board: Leaderboard = {
  benchmark: 'weatherqa-severe-weather', url: repo+'#benchmark-results', feed,
  terms: 'The authors credit NOAA for the underlying data. '+repo+'#readme',
  headline: 'The headline averages affected-area accuracy and severe weather concern accuracy conditional on a correct affected area.',
  parts: { area: 'Areas Affected QA', concern: 'Conditional Severe Weather Concern Classification' },
  async fetch() {
    const md = await fetchText(feed);
    const getTable = (marker: string) => {
      const section = md.split(marker)[1];
      if (!section) throw new Error('Missing '+marker);
      return markdownTables(section)[0];
    };
    const task1 = getTable('Task 1: Zero-shot Accuracy');
    const task2 = getTable('Task 2: Zero-shot Accuracy');
    if (![task1,task2].every(t => t[0].join('|') === 'Model|Accuracy')) throw new Error('Missing task columns');
    const concerns = new Map(task2.slice(1).map(([m,s]) => [m,accuracy(s)]));
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string, area: number, concern: number) {
      rows.push({ model, setting, score: (area+concern)/2, metrics: {area,concern} });
    }
    for (const [name,s] of task1.slice(1)) {
      const concern = concerns.get(name);
      if (concern === undefined) throw new Error('Missing second task for '+name);
      const tuned = name.endsWith(' (Finetuned)');
      const setting = name === 'Qwen2.5 VL 7B' ? 'Zero-shot, twenty images, pre-trained' : tuned ? 'Zero-shot, fine-tuned' : 'Zero-shot';
      add(name.replace(' (Finetuned)',''), setting, accuracy(s), concern);
    }
    const extra = getTable('Fine-tuning Performance: QwenVL2.5-7B');
    if (extra[0].join('|') !== 'Input Configuration|Model State|Area Affected Acc. (Task 1)|Conditional Concern Acc. (Task 2)') throw new Error('Missing image-count columns');
    let inputs = '';
    for (const [config,state,a,c] of extra.slice(1)) {
      if (config) inputs = config;
      if (inputs.startsWith('Twenty Images') && state === 'Pre-trained') {
        const main = rows.find(r=>r.model === 'Qwen2.5 VL 7B');
        if (main?.metrics?.area !== accuracy(a) || main?.metrics?.concern !== accuracy(c)) throw new Error('Default settings disagree');
        continue;
      }
      add('Qwen2.5 VL 7B', 'Zero-shot, '+inputs+', '+state, accuracy(a), accuracy(c));
    }
    return checked(rows,28);
  },
};
export default board;
