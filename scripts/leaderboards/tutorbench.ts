import {fetchScaleEntries,scaleRows,scaleFeed,SCALE_ALIASES} from '../lib/scale.ts';
const URL='https://labs.scale.com/leaderboard/tutorbench';
export default {benchmark:'tutorbench',url:URL,feed:scaleFeed(URL),
 terms:'Scale terms restrict automated access and license supported-browser use for internal purposes. The Almanac credits Scale AI and links the source.',
 aliases:{...SCALE_ALIASES,'llama4-maverick':'llama-4-maverick','claude-37-sonnet':'claude-3-7-sonnet','claude-4-opus-20250514':'claude-opus-4','claude-opus-4-1-20250805_anthropic':'claude-opus-4-1'},
 async fetch(){return scaleRows(await fetchScaleEntries(URL),(_n,e)=>/^gpt-4o$/.test(e.model)?{model:'GPT-4o (snapshot unspecified)'}:undefined);}};
