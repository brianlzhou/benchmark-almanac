// SoccerArena ranks 24-hour La Liga match forecasts by cumulative points. The page embeds its live standings and the numbers of scored and pending forecasts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';
interface Standing {model: string; points: number; exact: number; scored: number; pending: number; forecastHorizon: string; accessCondition: string; promptStrategy: string}

const FEED = "https://www.llm-soccerarena.com/laliga";
const board: Leaderboard = {
  benchmark: "llm-soccerarena-la-liga-2026-27",
  url: "https://www.llm-soccerarena.com/laliga",
  feed: FEED,
  terms: "The repository uses the MIT license. I found no separate license for reusing published scores. https://github.com/jonas-srd/world_cup_LLM_rank/blob/main/LICENSE The site's robots.txt publishes content signals.",
  stats:{exact:{name:'Exact score forecasts',unit:'count',better:'higher'},pending:{name:'Pending forecasts',unit:'count'}},
  async fetch() {
    const standings = jsonAfter<Standing[]>(nextFlight(await fetchText(FEED)), '"competition":"la-liga","locale":"en","leaderboard":');
    if (standings.length < 7) throw new Error('Missing La Liga models');
    return standings.map(r => {
      if (!r.model || ![r.points, r.exact, r.scored, r.pending].every(Number.isFinite)) throw new Error('Invalid La Liga standing');
      return { model: r.model, score: r.points, trials: r.scored, setting: [r.forecastHorizon, r.accessCondition, r.promptStrategy].join(', '),
        metrics: { exact: r.exact, pending: r.pending } };
    });
  },
};
export default board;
