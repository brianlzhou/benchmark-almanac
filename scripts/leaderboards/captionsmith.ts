// CaptionSmith tests timed ASR transcript conversion into valid SRT subtitles.
// The repository README reports calibration mean rewards for three named models.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://raw.githubusercontent.com/theSatvik/captionsmith/main/README.md';
const board:Leaderboard={benchmark:'captionsmith',url:'https://github.com/theSatvik/captionsmith',feed:FEED,terms:'The repository is licensed under MIT. https://github.com/theSatvik/captionsmith',async fetch(){const t=await fetchText(FEED);if(!t.includes('Qwen3.6 27B')||!t.includes('Gemma 4 8B'))throw new Error('Calibration results missing');return checked([{model:'Qwen3.6 27B',score:0.93},{model:'Gemma 4 8B',score:0.64},{model:'GPT-OSS 120B',score:0.31}],3)}};export default board;
