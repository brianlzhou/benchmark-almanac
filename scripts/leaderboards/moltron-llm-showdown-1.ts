// MOLTRON compares the mean win rate of working bots in its v1.0 exhibition. The page draws each mean and interval from exact percentages.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://ageofmoltron.com/leaderboard";


const board: Leaderboard = {
  benchmark: "moltron-llm-showdown-1",
  stats: { firstTryValid: { name: 'First-try valid attempts', unit: 'count' }, valid: { name: 'Valid attempts', unit: 'count' }, 'Avg tries to working': { name: 'Average tries to working', unit: 'count', better: 'lower' }, '1st-try rate': { name: 'First-try rate', unit: '%', better: 'higher' }, 'Gen time (working)': { name: 'Generation time for working attempts', unit: 'seconds', better: 'lower' }, 'Gen time (all attempts)': { name: 'Generation time for all attempts', unit: 'seconds', better: 'lower' }, botyp: { name: 'Botyp score', unit: '%', better: 'higher' }, bobest: { name: 'Bobest score', unit: '%', better: 'higher' } },
  url: "https://ageofmoltron.com/leaderboard",
  feed,
  terms: "The page publishes prompts and standings without an explicit reuse license. https://ageofmoltron.com/leaderboard The robots.txt route returns HTML.",
  async fetch() {
    const page = (await fetchText(feed)).split(/<section class="ver-panel" data-ver="v1\.0"[^>]*>/)[1]?.split('</section>')[0];
    if (!page) throw new Error('Missing v1.0 standings');
    const [opponents, timing] = tables(page);
    if (!opponents?.[0].some(c => c.text === 'vs hunter') || !timing?.[0].some(c => c.text === 'Gen time (working)')) throw new Error('Missing bot statistics');
    board.parts = Object.fromEntries(opponents[0].slice(3).map(c=>[c.text,c.text]));
    const rows = page.split('<div class="drow">').slice(1).map(chunk => {
      const model = chunk.match(/class="mname">([^<]+)/)?.[1];
      const mean = chunk.match(/class="meanline" style="left:([\d.]+)%/);
      const interval = chunk.match(/class="ciband" style="left:([\d.]+)%;width:([\d.]+)%/);
      const opp = opponents.find(r => r[0].text === model);
      const time = timing.find(r => r[0].text === model);
      if (!model || !mean || !interval || !opp || !time) throw new Error('Incomplete v1.0 run');
      const trials = Number(opp[2].text.split('/')[0]);
      const metrics:Record<string,number> = {firstTryValid:parseInt(opp[1].text), valid:trials};
      opp.slice(3).forEach((c,i)=>metrics[opponents[0][i+3].text] = parseFloat(c.text));
      time.slice(1).forEach((c,i)=>metrics[timing[0][i+1].text] = parseFloat(c.text));
      const best = page.split('class="borow">').slice(1).find(c => c.match(/class="mname">([^<]+)/)?.[1] === model);
      if(best) for (const k of ['botyp','bobest']) metrics[k] = Number(best.match(new RegExp('class="'+k+'" style="left:([\\d.]+)%'))?.[1]);
      return {model,score:Number(mean[1]),low:Number(interval[1]),high:Number(interval[1])+Number(interval[2]),trials,metrics};
    });
    if(rows.length < 6) throw new Error('Missing bot models');
    return rows;
  },
};
export default board;
