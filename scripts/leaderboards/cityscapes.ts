// Cityscapes tests pixel-level semantic labeling of street scenes. The official board ranks methods
// by mean class intersection over union (IoU), expressed as a percentage. The detailed feeds add
// individual class scores. Submission IDs join those feeds and distinguish repeated method names.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://www.cityscapes-dataset.com/benchmarks/#pixel-level-results';
const feed = 'https://www.cityscapes-dataset.com/benchmark-table/?challengeID=pixellevel';
type Entry = { name:string, submissionID:number, runtime?:number } & Record<string,unknown>;
const teamOnly = new Set([60,276,321,431,529,642,837,940,1396,1508,1842,1852,4344,4851,5787,5959,6330,6514,12390,12538,12603,12604,14024,14354,14834,14924,16335,16658]);
const identified: Record<number,string> = { 1786:'DSNet', 7635:'DeepLabv3+ decoder', 9210:'RefineNet', 20118:'VLTSeg' };
const board: Leaderboard = {
  benchmark:'cityscapes', url, feed,
  terms:'The Cityscapes team publishes this table at https://www.cityscapes-dataset.com/benchmarks/. Dataset terms are at https://www.cityscapes-dataset.com/license/.',
  async fetch() {
    const {data} = await fetchJson<{data:Entry[]}>(feed);
    const parts: Record<string,BoardPart> = { iiouclass:{name:'iIoU class'}, ioucategory:{name:'IoU category'}, iioucategory:{name:'iIoU category'} };
    const details = new Map<number,Record<string,number>>();
    for (const [metric,expected] of [['iouclass',19],['iiouclass',8]] as const) {
      await new Promise(resolve => setTimeout(resolve,1000));
      const result = await fetchJson<{data:Entry[]}>(feed+'&single_metric='+metric);
      for (const entry of result.data) {
        const scores = details.get(entry.submissionID) ?? {};
        const columns = Object.keys(entry).filter(k => k.startsWith(metric+'_'));
        if (columns.length !== expected) throw new Error('Missing per-class '+metric+' columns');
        for (const k of columns) {
          if (typeof entry[k] !== 'number') throw new Error('Missing '+k+' for '+entry.name);
          scores[k] = Number(entry[k]);
          parts[k] = {name:k.slice(metric.length+1),group:metric === 'iouclass' ? 'Class IoU':'Class iIoU'};
        }
        details.set(entry.submissionID,scores);
      }
    }
    const eligible = data.filter(entry => !teamOnly.has(entry.submissionID));
    const counts = new Map<string,number>();
    for (const entry of eligible) {
      const model = identified[entry.submissionID] ?? entry.name.trim();
      counts.set(model,(counts.get(model) ?? 0)+1);
    }
    board.parts = parts;
    const rows = eligible.map(entry => {
      const model = identified[entry.submissionID] ?? entry.name.trim();
      const metrics = details.get(entry.submissionID);
      if (!metrics || Object.keys(metrics).length !== 27 || !Number.isFinite(entry.iouclass)) throw new Error('Incomplete Cityscapes entry '+entry.submissionID);
      for (const k of ['iiouclass','ioucategory','iioucategory']) {
        if (typeof entry[k] !== 'number') throw new Error('Missing '+k);
        metrics[k] = Number(entry[k]);
      }
      if (typeof entry.runtime === 'number') metrics.latency = entry.runtime;
      return {model, score:Number(entry.iouclass), metrics, submitter:identified[entry.submissionID] ? entry.name : undefined,
        setting:counts.get(model)! > 1 ? 'Submission '+entry.submissionID : undefined,
        link:'https://www.cityscapes-dataset.com/method-details/?submissionID='+entry.submissionID};
    });
    return checked(rows,315-teamOnly.size);
  },
};
export default board;
