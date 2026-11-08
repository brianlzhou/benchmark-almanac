// Google moment finding: exact whole-task accuracy from author prose.
// The scatter plot has no printed values for other models. Its positions are not transcribed.
// Mean absolute distance, in seconds, remains a secondary metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-robotics-er-2/";
const board: Leaderboard = {
 benchmark: "moment-finding-google",
 url: "https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-robotics-er-2/",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {

 const s=text(await fetchText(FEED));
 const m=s.match(/For moment-finding tasks, Gemini Robotics ER 2 achieves\s*([\d.]+)% accuracy and a\s*([\d.]+)s mean absolute distance/);
 if(!m) throw new Error('Moment-finding prose changed');
 return checked([{model:'Gemini Robotics ER 2',score:Number(m[1]),metrics:{meanAbsoluteDistance:Number(m[2])}}]);

 },
};
export default board;
