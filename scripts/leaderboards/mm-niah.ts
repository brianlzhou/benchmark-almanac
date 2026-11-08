// MM-NIAH: Overall is the headline across context lengths and tasks. Context-length scores remain metrics.
// The retrieval variant uses the same full benchmark. Gemini-1.5 lacks an exact model specification.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2406.07230";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "mm-niah",
  url: "https://github.com/OpenGVLab/MM-NIAH",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows=await paperRows(FEED,{table:2,header:'Overall',score:12,width:13,min:8,metrics:{context1k:1,context2k:2,context4k:3,context8k:4,context12k:5,context16k:6,context24k:7,context32k:8,context40k:9,context48k:10,context64k:11}});
    return rows.map(r=>r.model==='InternVL-1.5-RAG'?{...r,model:'InternVL-1.5',harness:'RAG'}:r.model==='Gemini-1.5'?{...r,model:'Gemini-1.5 (model unspecified)'}:r);
  },
};
export default board;
