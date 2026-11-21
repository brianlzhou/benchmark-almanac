// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CAGUI tests grounding and agent actions in Chinese apps. OpenBMB's README reports grounding average and action type match.
// Type match is the first agent metric in the table. The separate exact-match score measures the entire action.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/OpenBMB/AgentCPM-GUI/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'cagui', url: 'https://github.com/OpenBMB/AgentCPM-GUI#performance-evaluation', feed,
  terms: 'Apache License 2.0. https://github.com/OpenBMB/AgentCPM-GUI/blob/main/LICENSE',
  headline: 'The authors report no overall score, so this is the plain mean of grounding average and action type match.',
  parts: {grounding:'Grounding average', typeMatch:'Action type match', exactMatch:'Action exact match',
    fun2point:'Fun2Point', text2point:'Text2Point', bbox2text:'Bbox2text'},
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const grounding = tables.find(t => t[0].join() === 'Model,Fun2Point,Text2Point,Bbox2text,Average');
    const agents = tables.find(t => t[0].includes('Chinese APP (CAGUI) TM'));
    if (!grounding || !agents) throw new Error('Missing CAGUI comparison tables');
    const tm = agents[0].indexOf('Chinese APP (CAGUI) TM'), em = agents[0].indexOf('Chinese APP (CAGUI) EM');
    if (em < 0) throw new Error('Missing exact match');
    const rows: LeaderboardRow[] = [];
    for (const [model, ...values] of grounding.slice(1)) {
      const agent = agents.slice(1).find(row => row[0] === model);
      if (!agent || agent[tm] === '-') continue;
      const cells = [...values, agent[tm], agent[em]];
      if (!cells.every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid CAGUI result for ' + model);
      const [fun2point, text2point, bbox2text, grounding, typeMatch, exactMatch] = cells.map(Number);
      rows.push({model, score: (grounding + typeMatch)/2, metrics: {fun2point, text2point, bbox2text, grounding, typeMatch, exactMatch}});
    }
    return checked(rows, 7);
  },
};
export default board;
