// DexArena compares robot policies across three evaluation protocols. Read the reported average success rate and task results for each protocol from the manuscript JSON.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://sipair-elastic.github.io/DexArena-website/leaderboard/";
const feed = "https://sipair-elastic.github.io/DexArena-website/assets/results/paper-results.json";
const stageTasks = [
  'OpenLunchBox', 'PlaceBread', 'ScoopTomato', 'OpenCabinet', 'PickBottle', 'UnscrewCap', 'PourBeads', 'OpenDrawer', 'PickCharger', 'InsertPlug',
  'PickBolt', 'SeatNut', 'TurnNut', 'OpenLaptop', 'TypeKeys', 'ClickMouse', 'LayFlatPanel', 'InsertRail', 'FastenScrew', 'AspirateLiquid',
  'DispenseLiquid', 'OpenFridge', 'AppleToBlender', 'CloseFridge', 'PlaceLid', 'PressButton', 'OpenPackage', 'ExtractApple', 'PickDebris', 'DumpDustpan',
];
const longHorizonTasks = [
  'Meal preparation', 'Cabinet and pouring', 'Drawer and plug', 'Nut and bolt', 'Office desk',
  'Furniture assembly', 'Pipette transfer', 'Juice preparation', 'Package opening', 'Table cleaning',
];

const board: Leaderboard = {
  benchmark: 'dexarena', url, feed,
  terms: "The authors do not specify separate terms for leaderboard scores on https://sipair-elastic.github.io/DexArena-website/leaderboard/" ,
  parts: Object.fromEntries([
    ...stageTasks.map(name => ['stage ' + name, {name, group: 'Stage benchmark'}]),
    ...stageTasks.map(name => ['generalization ' + name, {name, group: 'Scene generalization'}]),
    ...longHorizonTasks.map(name => ['longHorizon ' + name, {name, group: 'Long-horizon benchmark'}]),
  ]),
  async fetch() {
    type Value = {mean: number; std?: number};
    type Summary = {reportedAverage: Value[]; rows: {name: string; values: Value[]}[]};
    const data = await fetchJson<{models: {name: string}[]; protocol: {episodes: number; stageTasks: number; longHorizonTasks: number}} & Record<'stage' | 'generalization' | 'longHorizon', Summary>>(feed);
    const labels = {stage:'Stage benchmark', generalization:'Scene generalization', longHorizon:'Long-horizon benchmark'};
    if (data.models.length < 6 || !(data.protocol.episodes > 0)) throw new Error('Missing DexArena protocol or methods');
    return (Object.keys(labels) as (keyof typeof labels)[]).flatMap(key => {
      const section = data[key];
      const count = key === 'longHorizon' ? data.protocol.longHorizonTasks : data.protocol.stageTasks;
      if (section.rows.length !== count || count < (key === 'longHorizon' ? 10 : 30) || section.reportedAverage.length !== data.models.length) throw new Error('Incomplete ' + key);
      return data.models.map(({name}, i) => {
        const avg = section.reportedAverage[i];
        if (!name || !Number.isFinite(avg.mean)) throw new Error('Missing protocol average');
        const metrics: Record<string, number> = {};
        if (avg.std !== undefined) metrics.std = avg.std;
        for (const task of section.rows) {
          const metric = key + ' ' + task.name;
          const value = task.values[i];
          if (!Number.isFinite(value?.mean)) throw new Error('Missing ' + metric);
          metrics[metric] = value.mean;
          if (value.std !== undefined) metrics[metric + ' std'] = value.std;
        }
        return {model: name, score: avg.mean, setting: labels[key], metrics};
      });
    });
  },
};
export default board;
