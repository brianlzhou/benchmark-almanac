// DAVIS 2017 tests multi-object video segmentation. The organizers' test-dev board
// ranks methods by the mean of region overlap (J) and boundary accuracy (F).
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const base = 'https://davischallenge.org/json_data/';
const feed = base + 'global_eval_test-dev_2017.js';
const board: Leaderboard = {
  benchmark: 'davis-2017', feed, url: 'https://davischallenge.org/davis2017/soa_compare.html',
  terms: 'The DAVIS Challenge publishes the scores and credits each method. https://davischallenge.org/davis2017/soa_compare.html',
  stats:{
    Jmean:{name:'Region overlap mean',unit:'%',better:'higher',note:'Mean J measure for region overlap.'}, Jrecall:{name:'Region overlap recall',unit:'%',better:'higher'}, Jdecay:{name:'Region overlap decay',unit:'%',better:'lower'},
    Fmean:{name:'Boundary accuracy mean',unit:'%',better:'higher',note:'Mean F measure for boundary accuracy.'}, Frecall:{name:'Boundary accuracy recall',unit:'%',better:'higher'}, Fdecay:{name:'Boundary accuracy decay',unit:'%',better:'lower'},
  },
  async fetch() {
    const data = jsonAfter<Record<string, Record<string,string>> & {techniques: string[]}>(await fetchText(feed), 'var global_eval_test_dev_2017 =');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const meta = await fetchText(base + 'global_2017.js');
    const names = new Map([...meta.matchAll(/^"(\w+)"\s*:\s*\{"type":\s*"(semi2017|unsup2017)"[^\n]*?"display_name":\s*"([^"]+)"/gm)].map(m => [m[1],m]));
    return checked(data.techniques.map(id => {
      const name = names.get(id);
      if (!name) throw new Error('Missing DAVIS method: ' + id);
      const score = (key: string) => Number((100 * numberCell(data[id][key])).toFixed(4));
      const metrics = Object.fromEntries(['Jmean','Jrecall','Jdecay','Fmean','Frecall','Fdecay'].map(k => [k,score(k)]));
      return {model:name[3], setting: name[2] === 'semi2017' ? 'Semi-supervised, test-dev' : 'Unsupervised, test-dev', score:score('J_F'), metrics};
    }),21);
  },
};
export default board;
