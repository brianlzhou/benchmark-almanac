// DexVerse tests dexterous robot manipulation. The authors report the mean online
// success rate across 19 evaluated tasks, with 50 rollouts per task.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const url='https://ycyao216.github.io/DexVerse.site/';
const tasks=['BimanualLiftCarton','BimanualLiftTray','GraspBleach','GraspCup','GraspKettle','GraspPan','RetrieveCup',
  'OpenFaucet','OpenFlatFolder','OpenLaptop','OpenStapler','SlideUtilityKnife','SqueezeScissors','FunctionalHammerStrike',
  'FunctionalPourCan','FunctionalPourMug','InsertPen','PushSmallSphereObstacleSlope','PushT'];
const board: Leaderboard = {
  benchmark:'dexverse',url,feed:url,terms:'The authors publish these results at https://ycyao216.github.io/DexVerse.site/.',
  aliases:{'π0.5':'pi0-5'},parts:Object.fromEntries(tasks.map(t=>[t,t])),
  async fetch() {
    const table=tables(await fetchText(url)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.join('|')==='Category|Task|&pi; 0.5|OpenVLA|DP3|DP');
    if(!table) throw new Error('Missing DexVerse baseline table');
    const metricsByTask=new Map(table.slice(1).map(row=>[row.at(-5),row.slice(-4)]));
    const rows=['π0.5','OpenVLA','DP3','DP'].map((model,i)=>{
      const rate=(task:string)=>{
        const v=metricsByTask.get(task)?.[i];
        if(!v || !/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(v)) throw new Error('Invalid success rate for '+task);
        return Number(v)*100;
      };
      return {model,score:rate('Mean'),trials:50,metrics:Object.fromEntries(tasks.map(t=>[t,rate(t)]))};
    });
    return checked(rows,4);
  },
};
export default board;
