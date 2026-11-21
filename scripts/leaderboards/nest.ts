// NEST ranks video models by All, the overall closed-question score. The page builds its table from an inline results array and lists model size separately.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const url = "https://laubravo.github.io/nest_website/#leaderboard";
const feed = "https://laubravo.github.io/nest_website/";

const board: Leaderboard = {
  benchmark: 'nest', url, feed,
  terms: "The authors do not specify separate terms for leaderboard scores on https://laubravo.github.io/nest_website/#leaderboard" ,
  parts: { ctx: 'Contextual', beh: 'Behavioral', inter: 'Interpersonal' },
  async fetch() {
    const html = await fetchText(feed);
    const source = html.match(/const RESULTS\s*=\s*(\[[\s\S]*?\]);/);
    if (!source) throw new Error('Missing NEST results');
    type Result = {model: string; size: string; human?: boolean; api?: boolean} & Record<'ctx'|'beh'|'inter'|'all'|'sim'|'rec', number>;
    const data = jsLiteral<Result[]>(source[1].replace(/'([^'\n]*)'/g, (_,s: string) => JSON.stringify(s)),0).filter(r => !r.human);
    if (data.length < 17) throw new Error('Incomplete NEST table');
    return data.map(({model,size,api,all,ctx,beh,inter,sim,rec}) => {
      if (!model || !size || ![all,ctx,beh,inter,sim,rec].every(Number.isFinite)) throw new Error('Invalid NEST row');
      return { model: api ? model : model + ' ' + size, score: all, params: api ? undefined : Number.parseFloat(size), metrics: {ctx,beh,inter,sim,rec} };
    });
  },
};
export default board;
