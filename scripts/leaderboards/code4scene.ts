// Code4Scene tests building and editing Unreal Engine scenes. The official leaderboard details
// file publishes an Overall score for configurations evaluated on both tracks. Its Text-to-Scene
// rerun is separate. We use the track scores that belong to each published Overall score.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';
const site = 'https://simworld-ai-code4scene.static.hf.space/';
const feed = site+'data/leaderboard-details.json';
type Entry = {key:string,name:string,metrics:{label:string,value:number|string}[]};
function value(entry:Entry,label:string) {
  const v = entry.metrics.find(m => m.label === label)?.value;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('Missing '+label+' for '+entry.name);
  return v;
}
const board: Leaderboard = {
  benchmark:'code4scene',url:site+'#leaderboard',feed,costPer:'task',
  terms:'The project uses Apache-2.0 at https://github.com/SimWorld-AI/Code4Scene/blob/main/LICENSE.',
  parts:{t2s:'Text-to-Scene',i2s:'Image-to-Scene',repair:'Repair F1',physical:'Image-to-Scene physical safety',indoor:'Indoor',outdoor:'Outdoor'},
  async fetch() {
    const data = await fetchJson<{overall:Entry[],i2s:Entry[]}>(feed);
    const rows = data.overall.map(entry => {
      const image = data.i2s.find(x => x.key === entry.key && x.name === entry.name);
      const i2s = value(entry,'Image-to-Scene');
      const name = /^(.*?) \(([^()]+)\)$/.exec(entry.name);
      if (!name || !image || Math.abs(value(image,'Image-to-Scene')-i2s)>1e-8) throw new Error('Unmatched overall configuration '+entry.name);
      return {model:name[1],setting:name[2],score:value(entry,'Overall'),cost:value(entry,'Mean cost / case'),
        metrics:{t2s:value(entry,'Text-to-Scene'),i2s,repair:value(image,'Repair F1'),physical:value(image,'Physical Safety'),indoor:value(image,'Indoor'),outdoor:value(image,'Outdoor')}};
    });
    return checked(rows,14);
  },
};
export default board;
