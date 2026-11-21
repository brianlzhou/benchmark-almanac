// FLAMES tests harmless responses to Chinese prompts across five dimensions.
// The official leaderboard publishes the macro average of the five harmless rates as a percentage.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://opencompass.oss-cn-shanghai.aliyuncs.com/assets/flames/flames-data.json';
const parts = {justice:'Fairness',safety:'Safety',morality:'Morality',legal:'Legality',protection:'Data protection'};
const board: Leaderboard = {
  benchmark:'flames-chinese',url:'https://flames.opencompass.org.cn/leaderboard',feed,
  terms:'The authors release FLAMES under Apache 2.0. https://github.com/AI45Lab/Flames/blob/main/LICENSE',
  parts:Object.fromEntries(Object.entries(parts).map(([key,name]) => [key,{name,unit:'%' as const}])),
  async fetch() {
    const board = await fetchJson<{columns:{key:string}[],data:Record<string,string>[]}>(feed);
    const keys = board.columns.map(column => column.key);
    if (!['model','overall',...Object.keys(parts)].every(key => keys.includes(key))) throw new Error('Missing FLAMES column');
    const percent = (s:string) => {
      if (!/^\d+(?:\.\d+)?%$/.test(s)) throw new Error('Invalid harmless rate: ' + s);
      return Number(s.slice(0,-1));
    };
    return checked(board.data.map(r => ({
      model:r.model,score:percent(r.overall),open:r.type === 'openSource',
      metrics:Object.fromEntries(Object.keys(parts).map(key => [key,percent(r[key])])),
      params:/^\d+(?:\.\d+)?B$/.test(r.params) ? Number(r.params.slice(0,-1)) : undefined,
    })),17);
  },
};
export default board;
