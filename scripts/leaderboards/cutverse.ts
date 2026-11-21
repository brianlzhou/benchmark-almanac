// CutVerse evaluates agents on 186 media editing tasks. Table 3 gives overall task
// and milestone success rates. Table 4 reports task execution accuracy by application.
import type { Leaderboard } from './types.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://arxiv.org/html/2605.19484';
const pct = (s: string) => Number((100 * numberCell(s)).toFixed(2));
const categories = ['Generative Workflow (GW)','Export and Delivery (ED)','Launch and Setup (LS)','Preview, Check, and Validation (PCV)','Asset Import and Management (AIM)','Timeline Editing and Arrangement (TEA)','Effects and Visual Tuning (EVT)','Audio and Rhythm Editing (ARE)','Masking, Matting, and Tracking (MMT)'];
const applications = ['Keling','ComfyUI','JianYing','DaVinci','Premiere Pro','Photoshop','After Effects'];
const parts = Object.fromEntries([
  ...categories.map(name => [name, {name, group:'Task success'}]),
  ...categories.map(name => ['Milestones: ' + name, {name, group:'Milestone success'}]),
  ...applications.map(name => [name, {name, group:'Execution accuracy by application'}]),
]);
const board: Leaderboard = {
  benchmark: 'cutverse', feed, url: feed, static: 'paper',
  aliases: {'Qwen3-VL-32B-T': 'qwen3-vl-32b-thinking'},
  terms: 'The authors publish the results under the terms linked at https://arxiv.org/abs/2605.19484.',
  parts,
  stats:{milestoneSuccess:{name:'Milestone success rate',unit:'%',better:'higher'}},
  async fetch() {
    const ts = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = ts.find(t => t[0]?.[1] === 'Task Success Rate' && t[0][6] === 'Milestone Success Rate');
    const apps = ts.find(t => t[0]?.join('|') === 'Software|AvgSteps|AvgDur(s)|Claude|Gemini|Evo|Qwen|UI-TARS');
    const total = main?.find(c => c[0] === 'Average (Overall)');
    const models = ['Qwen3-VL-32B-T','UI-TARS-1.5-7B','Claude Opus 4.6','Gemini 3 Flash','EvoCUA-32B'];
    if (!main || !total || !apps || main[1].slice(1,6).some((s,i) => !s.startsWith(['Qwen3','UI-TARS','Claude','Gemini3','EvoCUA'][i]))) throw new Error('Missing CutVerse model columns');
    const categories = main.slice(2).filter(c => !c[0].startsWith('Average') && c[0] !== c[1]);
    board.parts = parts;
    return checked(models.map((model,i) => {
      const metrics: Record<string,number> = {milestoneSuccess:pct(total[6+i])};
      for (const c of categories) {
        metrics[c[0]] = pct(c[i+1]);
        metrics['Milestones: ' + c[0]] = pct(c[i+6]);
      }
      for (const c of apps.slice(1)) metrics[c[0]] = pct(c[[6,7,3,4,5][i]]);
      return {model, score:pct(total[i+1]), metrics};
    }),5);
  },
};
export default board;
