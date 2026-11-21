// Spatial-Map tests spatial reasoning given text, images or both. Tables 7 and 8 report accuracy
// for each input format. Table 8 also reports accuracy on each of the three question types.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.14852';
const board: Leaderboard = {
  benchmark: 'spatialeval-spatial-map', static: 'paper', url: 'https://arxiv.org/abs/2406.14852', feed, terms: PAPER_TERMS,
  parts: {q1:'Q1 Acc', q2:'Q2 Acc', q3:'Q3 Acc'},
  aliases: { 'GPT-4o':'gpt-4o-may-2024', 'Mistral-7B':'mistral-7b-instruct-v0-2', CogVLM:'cogvlm-17b-chat', CogAgent:'cogagent-18b', 'LLaVA-1.6-34B':'llava-v1-6-34b', 'LLaVA-1.6-Mistral-7B':'llava-v1-6-mistral-7b', 'LLaVA-1.6-Vicuna-13B':'llava-v1-6-vicuna-13b', 'LLaVA-1.6-Vicuna-7B':'llava-v1-6-vicuna-7b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const closed = tables.find(t => t[0]?.[2] === 'Spatial-Map Acc');
    const figure = html.match(/<figure\b[^>]*id="A6.T8"[\s\S]*?<\/figure>/)?.[0];
    const detail = figure && flatPaperTables(figure).map(grid).find(t => t[0]?.join('|') === 'Input Format|Model Name|Q1 Acc|Q2 Acc|Q3 Acc|Avg Acc');
    if (!closed || !detail || detail.length < 21 || closed.length < 14) throw new Error('Missing Spatial-Map results');
    const pct = (v: string) => Math.round(numberCell(v)*1000)/10;
    return [...closed.slice(1).map(([setting,model,value]) => ({model, setting, score:pct(value)})),
      ...detail.slice(1).map(([setting,model,q1,q2,q3,avg]) => ({model,setting,score:pct(avg),metrics:{q1:pct(q1),q2:pct(q2),q3:pct(q3)}}))];
  },
};
export default board;
