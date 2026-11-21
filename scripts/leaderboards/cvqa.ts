// CVQA measures visual question answering across countries and languages. Its EvalAI test board
// ranks submissions by macro accuracy. The paper gives the authors’ English and local prompt results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { EVALAI_TERMS, evalaiFeed } from './blink.ts';
import { fetchJson } from '../lib/util.ts';
import { paperHtml, PAPER_TERMS, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = evalaiFeed(5695);
const paper = 'https://arxiv.org/html/2406.05967';
interface Entry {
  id:number; submission__id:number; submission__participant_team__team_name:string; submission__method_name:string;
  submission__submitted_at:string; submission__is_verified_by_host:boolean; result:(number|'#')[];
  submission__submission_metadata:{name:string;value?:string}[];
  leaderboard__schema:{labels:string[];default_order_by:string};
}
const board: Leaderboard = {
  benchmark:'cvqa', static: 'paper',url:'https://eval.ai/web/challenges/challenge-page/2305/leaderboard/5695',feed:feed+' and '+paper,
  terms:EVALAI_TERMS+' '+PAPER_TERMS, verified:'verified by the CVQA host on EvalAI',
  aliases:{'LLaVA-1.5-7B':'llava-v1-5-7b','GPT-4o':'gpt-4o-may-2024','Gemini-1.5-Flash':'gemini-1-5-flash-may-2024'},
  async fetch() {
    const parts: Record<string,string> = {};
    const rows: LeaderboardRow[] = [];
    let url: string|null = feed, seen = 0;
    const visited = new Set<string>();
    while (url) {
      if (visited.has(url) || !url.startsWith(feed.split('?')[0]+'?')) throw new Error('Unexpected EvalAI pagination');
      visited.add(url);
      const p: {results:Entry[];next:string|null;count:number} = await fetchJson(url);
      for (const r of p.results) {
        seen++;
        if (r.submission__method_name === 'Random') continue;
        const {labels,default_order_by} = r.leaderboard__schema;
        if (labels[0] !== 'Macro-Acc' || default_order_by !== labels[0] || labels.length < 40 || labels.length !== r.result.length ||
          typeof r.result[0] !== 'number' || !r.result.every(x => x === '#' || (Number.isFinite(x) && x >= 0 && x <= 1))) throw new Error('Unexpected CVQA metrics');
        const metrics: Record<string,number> = {submissionId:r.submission__id};
        labels.slice(1).forEach((k,i) => {parts[k] = k; const value = r.result[i+1]; if (typeof value === 'number') metrics[k] = value*100;});
        const team = r.submission__participant_team__team_name;
        const model = r.submission__method_name?.trim() || team+' (submission '+r.submission__id+')';
        rows.push({model,setting:r.submission__submission_metadata?.find(m => m.name === 'Language Used')?.value || undefined,
          submitter:team,score:r.result[0]*100,metrics,date:r.submission__submitted_at.slice(0,10),verified:r.submission__is_verified_by_host});
      }
      url = p.next;
      if (!url && (seen !== p.count || seen < 20)) throw new Error('Incomplete CVQA leaderboard');
      if (url) await new Promise(r => setTimeout(r,1000));
    }
    const tables = flatPaperTables(await paperHtml(paper)).map(grid);
    const main = tables.find(t => t[0]?.[0] === 'LLaVA-1.5-7B' && t[0].includes('GPT-4o'));
    const prompt = tables.find(t => t[0]?.[0] === 'Prompt type');
    const detail = tables.filter(t => ['Categories','Image Source'].includes(t[0]?.[0]));
    if (!main || !prompt || detail.length !== 2 || main[0].length !== 16) throw new Error('Missing CVQA paper results');
    main[0].forEach((model,i) => {
      const language = main[1][i];
      const metrics: Record<string,number> = {};
      if (i+1 < prompt[0].length) {
        if (prompt[0][i+1] !== model || prompt[1][i+1] !== language) throw new Error('Misaligned CVQA columns');
        rows.push({model,setting:'Paper, '+language+', '+prompt[3][0],score:numberCell(prompt[3][i+1])});
        for (const t of detail) for (const r of t.slice(2)) {parts[r[0]] = r[0]; metrics[r[0]] = numberCell(r[i+1]);}
      }
      rows.push({model,setting:'Paper, '+language+', Location-aware',score:numberCell(main[2][i]),metrics});
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
