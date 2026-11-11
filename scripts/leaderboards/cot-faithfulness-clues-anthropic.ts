// The article gives exact overall hint-verbalization averages in prose.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
const PAGE='https://www.anthropic.com/research/reasoning-models-dont-say-think';
const board:Leaderboard={benchmark:'cot-faithfulness-clues-anthropic',url:PAGE,feed:PAGE,terms:'Anthropic website terms restrict automated access. The Almanac credits and links the source.',async fetch(){
 const s=text(await fetchText(PAGE)),m=s.match(/Claude 3\.7 Sonnet mentioned the hint (\d+)% of the time, and DeepSeek R1 mentioned it (\d+)%/);
 if(!m)throw new Error('Overall hint averages missing');
 return [{model:'Claude 3.7 Sonnet',score:Number(m[1]),setting:'average across hint types'},{model:'DeepSeek R1 (snapshot unspecified)',score:Number(m[2]),setting:'average across hint types'}];
}};export default board;
