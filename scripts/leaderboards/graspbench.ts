// GraspBench tests whether six grasp-generation pipelines lift objects across four simulated robots.
// Table III gives the success rate over 540 scenarios, counting missing outputs as failures, and Wilson intervals.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2611.07651';
const board: Leaderboard = {
  benchmark:'graspbench', url:'https://github.com/bk-poudel/GraspBench', feed, static:'paper',
  terms:'The authors publish the results in https://arxiv.org/abs/2611.07651.',
  stats:{
    successful:{name:'Successful scenarios',unit:'count'},
    missing:{name:'Missing outputs',unit:'count'},
    candidateMean:{name:'Mean candidates',unit:'count'},
    candidateMedian:{name:'Median candidates',unit:'count'},
    ikMax:{name:'Maximum inverse-kinematics iterations',unit:'count'},
    successGivenRecord:{name:'Success among returned records',unit:'%',better:'higher'},
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t=>t[0].join('|')==='Method|Success n/540 (%)|95% int. (%)|Missing|Cand. mean/med.|IK max');
    const avail = tables.find(t=>t[0]?.[2]==='E2E SR' && t[0][3]==='SR|record');
    if (!main || !avail) throw new Error('Missing GraspBench results tables');
    return checked(main.slice(1).map(([model,cell,interval,missing,candidates,ik])=>{
      const result = cell.match(/^(\d+) \(([\d.]+)\)$/), limits = interval.match(/^\[([\d.]+), ([\d.]+)\]$/);
      const counts = candidates.split('/').map(numberCell);
      const other = avail.find(r=>r[0]===model);
      if (!result || !limits || counts.length!==2 || other?.[2]!==result[2]) throw new Error('Invalid result for '+model);
      return {model,score:numberCell(result[2]),low:numberCell(limits[1]),high:numberCell(limits[2]),trials:540,
        metrics:{successful:numberCell(result[1]),missing:numberCell(missing),candidateMean:counts[0],candidateMedian:counts[1],
          ...(ik==='–'?{}:{ikMax:numberCell(ik)}),successGivenRecord:numberCell(other[3])}};
    }),6);
  },
};
export default board;
