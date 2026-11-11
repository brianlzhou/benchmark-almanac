// AILuminate Safety 1.2.1 English (US): official overall percentile, not raw harmlessness accuracy.
// Language systems and guardrails remain distinct source identities. Release months are not evaluation dates.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables,num } from '../lib/html.ts';
const URL='https://mlcommons.org/ailuminate/safety/results/';
const board:Leaderboard={benchmark:'mlcommons-ailuminate',url:URL,feed:URL,
 terms:'Official AILuminate Safety 1.2.1 English (US) percentile results from MLCommons. Benchmark Almanac credits MLCommons and links its citation and messaging policies; AILuminate is its trademark.',
 async fetch(){const html=await fetchText(URL);if(!html.includes('Safety 1.2.1'))throw new Error('AILuminate version changed');const ts=tables(html).filter(t=>t[0]?.[1]?.text==='Percentile Score (higher is better)');if(!ts.length)throw new Error('AILuminate tables missing');return ts.flatMap(t=>t.slice(1).map(r=>({model:r[0].text.replace(/ Released .*$/,''),score:num(r[1].text)!,setting:'Safety 1.2.1; English (US); overall percentile'})));}};
export default board;
