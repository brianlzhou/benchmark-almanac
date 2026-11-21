// Full-Duplex-Bench v3 reports tool-use Pass@1 fractions, converted to percent.
// Other tool metrics, turn-taking, interruptions, filler rates and latency remain attached.
// Voice-system labels do not identify exact API snapshots.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://daniellin94144.github.io/FDB-v3-demo/";
const board: Leaderboard = {
 benchmark: "full-duplex-bench-3", url: "https://daniellin94144.github.io/FDB-v3-demo/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 stats:{argumentAccuracy:{name:'Argument accuracy',unit:'%',better:'higher'},filler:{name:'Filler rate',unit:'%',better:'lower'},interrupt:{name:'Interruption rate',unit:'%',better:'lower'},latency:{name:'Latency',unit:'ms',better:'lower'},responseQuality:{name:'Response quality',unit:'%',better:'higher'},toolSelection:{name:'Tool selection accuracy',unit:'%',better:'higher'},turnTaking:{name:'Turn-taking score',unit:'score',better:'higher'}},

 async fetch() {
const t=tables(await fetchText(FEED))[0];if(!t?.[1]?.some(c=>c.text.includes('Pass@1')))throw new Error('Missing main results');return t.slice(2).map(r=>({model:r[0].text+' [voice system]',score:num(r[4].text)!*100,setting:'v3 tool use',metrics:{toolSelection:num(r[1].text)!*100,argumentAccuracy:num(r[2].text)!*100,responseQuality:num(r[3].text)!*100,turnTaking:num(r[5].text)!,latency:num(r[6].text)!,interrupt:num(r[7].text)!,filler:num(r[8].text)!}}));
 },
};
export default board;
