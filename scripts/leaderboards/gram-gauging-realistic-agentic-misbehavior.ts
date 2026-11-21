// Gram measures sabotage propensity across simulated deployments. Figure 7 plots five judge-score
// buckets for each model, condition and auditor. Scores of five or higher count as sabotage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2605.30322v1/overview.svg';
const models = {'#174ea6':'Gemini 3.1 Pro Preview','#0d652d':'Gemini 3.0 Pro Preview','#e37400':'Gemini 2.5 Pro'};
const settings = ['Model Organism / Observe','Model Organism / Red Team','Regular / Observe','Regular / Red Team'];
const judges = ['Sabotage Degree','Scheming Reasoning','Verbalized Evaluation Awareness'];
export default {
  benchmark:'gram-gauging-realistic-agentic-misbehavior', static: 'paper', url:'https://arxiv.org/html/2605.30322v1',feed,terms:PAPER_TERMS,
  aliases:{'Gemini 3.0 Pro Preview':'gemini-3-pro','Gemini 3.1 Pro Preview':'gemini-3-1-pro'},
  stats: Object.fromEntries(judges.flatMap(judge => Array.from({length: 5}, (_, k) => [
    judge + ' ' + (2 * k + 1) + '–' + (2 * k + 2),
    {name: judge + ' ' + (2 * k + 1) + '–' + (2 * k + 2), unit: '%' as const,
      note: 'Share of responses in this judge-score bucket.'},
  ]))),
  async fetch() {
    const svg = await paperHtml(feed);
    const pattern = /d="M([\d.]+) ([\d.]+)H[\d.]+(?:V([\d.]+)H| )[\d.]+Z" fill="(#[\da-f]+)" fill-opacity=".85"/g;
    const bars = [...svg.matchAll(pattern)].map(m => ({x:Number(m[1]),y:Number(m[2]),h:Number(m[3] ?? m[2])-Number(m[2]),color:m[4]}));
    const rows: LeaderboardRow[] = [];
    for (const [color, model] of Object.entries(models)) {
      const data = bars.filter(b => b.color === color);
      const levels = [...new Set(data.map(b => b.y))].sort((a,b) => b-a);
      const panels = levels.map(y => data.filter(b => b.y === y).sort((a,b) => a.x-b.x)).filter(b => b.length === 15);
      if (panels.length !== 4) throw new Error('Missing Gram panels for '+model);
      panels.forEach((bars,i) => {
        const metrics: Record<string,number> = {};
        let score = 0;
        judges.forEach((judge,j) => {
          const buckets = bars.slice(5*j,5*j+5);
          const total = buckets.reduce((s,b) => s+b.h,0);
          if (total <= 0) throw new Error('Empty Gram distribution');
          buckets.forEach((b,k) => {metrics[judge+' '+(2*k+1)+'–'+(2*k+2)] = Math.round(1000*b.h/total)/10;});
          if (!j) score = Math.round(1000*buckets.slice(2).reduce((s,b) => s+b.h,0)/total)/10;
        });
        rows.push({model,setting:settings[i],score,metrics});
      });
    }
    return rows;
  },
} satisfies Leaderboard;
