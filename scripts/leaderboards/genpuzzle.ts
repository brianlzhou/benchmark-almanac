// GenPuzzle tests image generation models on visual puzzles. The Gemini 3.1 Pro judge report
// ranks models by Macro Overall, the equal-weight average across puzzle categories.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const root = 'https://huggingface.co/datasets/zhangsan672/GenPuzzle';
const report = 'runs/report_gpt_vs_gemini_vs_seedream_evalgemini3.1pro/leaderboard.md';
const feed = root + '/resolve/main/' + report;
const tracks = ['Figure Completion','Spatial Generation','Maze: Beginner','Maze: Intermediate','Maze: Advanced','Sudoku','Nonogram','Tangram','Board Games','Matchsticks','Orthographic','Math Visual Proof'];
const board:Leaderboard = {
  benchmark:'genpuzzle',url:root+'/blob/main/'+report,feed,
  terms:'The authors license result files under CC BY 4.0. https://github.com/zhaochangpeng-csu/GenPuzzle#license',
  aliases:{'doubao-seedream-5-0-pro-260628':'seedream-5-0-pro','openai:gpt-image@2':'gpt-image-2'},
  parts:Object.fromEntries(tracks.map(name => [name,{name,unit:'score' as const}])),
  stats: { microOverall: { name: 'Micro overall score', unit: 'score', better: 'higher' }, totalCount: { name: 'Total puzzles', unit: 'count' }, ...Object.fromEntries(tracks.map(name => [name + ' count', { name: name + ' puzzles', unit: 'count' }])) },
  async fetch() {
    const lines = (await fetchText(feed)).split(/\r?\n/).filter(l => l.startsWith('|'));
    const cells = (line:string) => line.trim().split('|').slice(1,-1).map(s => s.trim().replace(' · ',': '));
    const expected = ['Rank','Model','Macro Overall','Micro Overall','Total Count',...tracks];
    if (cells(lines[0]).join('|') !== expected.join('|')) throw new Error('Missing GenPuzzle leaderboard columns');
    return checked(lines.slice(2).map(line => {
      const [,model,macro,micro,count,...scores] = cells(line);
      if (scores.length !== tracks.length) throw new Error('Missing puzzle tracks');
      const metrics:Record<string,number> = {microOverall:numberCell(micro),totalCount:numberCell(count)};
      scores.forEach((s,i) => {
        const m = s.match(/^(\d+(?:\.\d+)?) \((\d+)\)$/);
        if (!m) throw new Error('Invalid track score: '+s);
        metrics[tracks[i]] = Number(m[1]);
        metrics[tracks[i]+' count'] = Number(m[2]);
      });
      return {model,score:numberCell(macro),metrics,setting:'Gemini 3.1 Pro judge'};
    }),3);
  },
};
export default board;
