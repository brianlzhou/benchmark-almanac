// Flash Fiction Stylistic Diversity measures within-model style range across generated stories.
// Higher weighted Gower mean pairwise distance means a wider stylistic range, not higher quality.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
const FEED='https://raw.githubusercontent.com/lechmazur/writing_styles/main/README.md';
const board:Leaderboard={benchmark:'flash-fiction-stylistic-diversity-lech-mazur',url:'https://github.com/lechmazur/writing_styles',feed:FEED,terms:'Public repository results. Attribution and source licensing apply.',async fetch(){const s=await fetchText(FEED);const rows:LeaderboardRow[]=[];for(const m of s.matchAll(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)\s*\|$/gm))rows.push({model:m[1].trim(),score:Number(m[2])});if(rows.length<2)throw new Error('diversity table missing');return rows;}};export default board;
