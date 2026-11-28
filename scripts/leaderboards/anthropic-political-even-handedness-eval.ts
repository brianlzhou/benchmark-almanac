// Values printed in the official chart, verified 2026-11-10. The article specifies
// Llama 4 Maverick and comparator reasoning settings. Gemini's snapshot is unspecified.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const URL='https://www.anthropic.com/research/political-even-handedness';
const IMAGE='https://www-cdn.anthropic.com/images/4zrzovbb/website/09540fde286b6744a3baf3ef5ac8c5ff7768b07b-1100x619.png';
const board:Leaderboard={benchmark:'anthropic-political-even-handedness-eval',url:URL,feed:IMAGE,stats:{opposingPerspectives:{name:'Opposing perspectives rate',unit:'%',better:'higher'},refusal:{name:'Refusal rate',unit:'%',better:'lower'}},
 terms:'Anthropic website terms restrict automated access. The Almanac credits Anthropic and links the source.',
 async fetch(){return chartRows(IMAGE,'edeff00ddd0a92dd28bfce4c242c0d450e9f8fd56487f0e57b77f534e5f5ffaf',[
  {model:'Claude Opus 4.1',score:95,low:94,high:96,metrics:{opposingPerspectives:46,refusal:5}},
  {model:'Claude Sonnet 4.5',score:94,low:93,high:95,metrics:{opposingPerspectives:35,refusal:3}},
  {model:'GPT-5',score:89,low:87,high:91,setting:'low reasoning, no system prompt'},
  {model:'Gemini 2.5 Pro (snapshot unspecified)',score:97,low:96,high:98,setting:'lowest thinking, no system prompt'},
  {model:'Grok 4',score:96,low:95,high:97,setting:'thinking, system prompt',metrics:{opposingPerspectives:34}},
  {model:'Llama 4 Maverick',score:66,low:63,high:69,setting:'system prompt',metrics:{opposingPerspectives:31,refusal:9}},
 ]);}};
export default board;
