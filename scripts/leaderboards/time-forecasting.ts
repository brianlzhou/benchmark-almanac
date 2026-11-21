// TIME evaluates probabilistic forecasts. Its Overall Performance table sorts by normalized MASE, lower first.
// The Gradio configuration includes all four overall measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://real-tsf-time-leaderboard.hf.space/config";

type Table = {headers: string[]; data: [string, number, number, number, number][]};

const board: Leaderboard = {
  benchmark: "time-forecasting",
  url: "https://huggingface.co/spaces/Real-TSF/TIME-leaderboard",
  feed: FEED,
  terms: "The project lists Apache 2.0 for its code and CC BY-NC 4.0 for the input dataset. https://github.com/zqiao11/TIME",
  stats: { crps:{name:'Continuous ranked probability score',unit:'score',better:'lower'}, crpsRank:{name:'Continuous ranked probability score rank',unit:'count',better:'lower'}, maseRank:{name:'Mean absolute scaled error rank',unit:'count',better:'lower'} },
  async fetch() {
    const config = await fetchJson<{components: {type: string; props: {value: Table}}[]}>(FEED);
    const table = config.components.find(c => c.type === 'dataframe' && c.props.value.headers.includes('MASE (norm.)'))?.props.value;
    if (!table || table.headers.join('|') !== 'model|MASE (norm.)|CRPS (norm.)|MASE_rank|CRPS_rank' || table.data.length < 48) throw new Error('Unexpected TIME overall table');
    return table.data.map(([model,score,crps,maseRank,crpsRank]): LeaderboardRow => {
      if (!model || ![score,crps,maseRank,crpsRank].every(Number.isFinite)) throw new Error('Incomplete TIME row');
      return {model, score, metrics: {crps, maseRank, crpsRank}};
    });
  },
};
export default board;
