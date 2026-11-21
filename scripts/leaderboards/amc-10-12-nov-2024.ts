// Figure 1 of the Phi-4 report measures mean contest points across four November AMC exams.
// The chart shows nine models with two-standard-error bars. The text reports a tenth result for QwQ.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const page = 'https://arxiv.org/html/2412.08905v1';
const feed = page + '/amcplot.svg';
const models = ['Llama-3.3 70B Instruct','Claude 3.5 Sonnet','Qwen 2.5 14b-Instruct','GPT 4o','GPT 4o-mini',
  'Qwen 2.5 72b-Instruct','Gemini Flash 1.5','Gemini Pro 1.5','phi-4'];
export default {
  benchmark:'amc-10-12-nov-2024', static: 'paper', url:page, feed, terms:PAPER_TERMS,
  aliases:{'Qwen 2.5 14b-Instruct':'qwen2-5-14b','QwQ':'qwq-32b-preview'},
  async fetch() {
    const svg = await paperHtml(feed);
    const paper = await paperHtml(page);
    const bars = [...svg.matchAll(/d="M[\d.]+-[\d.]+H[\d.]+V([\d.]+)H[\d.]+Z" fill="#(?:add8e6|0000ff)"/g)];
    const errors = [...svg.matchAll(/stroke-width="1.5"[^>]*d="M[\d.]+ ([\d.]+)V([\d.]+)"/g)];
    const ticks = [...svg.matchAll(/stroke-width=".8"[^>]*d="M56\.324 ([\d.]+)H52\.824"/g)].map(m => Number(m[1]));
    if (bars.length !== models.length || errors.length !== models.length || ticks.length !== 4) throw new Error('AMC chart changed');
    const points = (y:string) => Math.round((60 + 30*(Number(y)-ticks[0])/(ticks[3]-ticks[0]))*10)/10;
    const rows: LeaderboardRow[] = models.map((model,i) => ({model: model === 'GPT 4o' ? model+' (snapshot unspecified)' : model,score:points(bars[i][1]),low:points(errors[i][1]),
      high:points(errors[i][2]),trials:100,setting:'Temperature 0.5'}));
    const qwq = paper.match(/QwQ, the only such model with open weights, averages ([\d.]+) points/);
    if (!qwq) throw new Error('Missing QwQ AMC result');
    rows.push({model:'QwQ',score:Number(qwq[1]),setting:'Temperature 0.5'});
    return rows;
  },
} satisfies Leaderboard;
