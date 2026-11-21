// HarvestBench measures how often a model continues through an animal encounter in a farming game.
// The board ranks the morality briefing by animal continue rate. It also reports a neutral briefing and controls.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://compassionbench.com/harvestbench';
const board:Leaderboard = {
  benchmark:'harvestbench',url:feed,feed,
  terms:'The HarvestBench implementation uses MIT. https://github.com/CompassionML/harvestbench/blob/main/LICENSE',
  parts:{neutralContinuePct:{name:'Neutral briefing animal continue rate',unit:'%',better:'lower'},
    hayContinuePct:{name:'Hay continue rate',unit:'%'},rockContinuePct:{name:'Rock continue rate',unit:'%',better:'lower'}},
  async fetch() {
    const page = await fetchText(feed);
    const bundle = page.match(/<script\b[^>]*src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!bundle) throw new Error('Missing HarvestBench bundle');
    const js = await fetchText(new URL(bundle,feed).href);
    const rows:LeaderboardRow[] = [];
    for (const match of js.matchAll(/\{modelId:"[^{}]+?animalContinuePct:[^{}]+?\}/g)) {
      const entry = JSON.parse(match[0].replace(/([{,])(\w+):/g,'$1"$2":').replace(/:\.(\d+)/g,':0.$1'));
      const metrics:Record<string,number> = {};
      for (const k of ['animalEncounters','neutralEncounters','hayContinuePct','rockContinuePct','killedPerShift','cropsPerShift','neighborsPerShift','thinkTokensPerCall']) {
        if (!Number.isFinite(entry[k])) throw new Error('Missing HarvestBench metric: '+k);
        metrics[k] = entry[k];
      }
      if (entry.neutralContinuePct !== null) metrics.neutralContinuePct=entry.neutralContinuePct;
      if (!Number.isInteger(entry.shifts)) throw new Error('Missing shift count');
      rows.push({model:entry.model,score:entry.animalContinuePct,trials:entry.shifts,metrics,setting:'Morality briefing'});
    }
    return checked(rows,10);
  },
};
export default board;
