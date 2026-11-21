// Mind the Gap evaluates inline audio descriptions. Tables 5 and 6 list Prioritization first and report 95% intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2610.39955";
const board: Leaderboard = {
  benchmark: "mind-the-gap", static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the license listed at https://arxiv.org/abs/2610.39955.',
  headline: 'The paper gives no overall score. Prioritization measures how well descriptions cover salient visual events.',
  parts: { NoRedundancy: 'No Redundancy', OnScreenText: 'On-Screen Text',
    Timeliness: {name: 'Timeliness', unit: 'score', better: 'lower', note: 'Seconds.'},
    AudioOverlaps: {name: 'Audio Overlaps', unit: 'score', better: 'lower', note: 'Seconds.'},
    AudioCoverage: {name: 'Audio Coverage', note: 'A ratio of one fills the available silence.'},
    AvgSilence: {name: 'Average Silence', unit: 'score', better: 'lower', note: 'Seconds.'},
    VideoA11yRefDescriptive: 'VideoA11y-Ref Descriptive', VideoA11yRefObjective: 'VideoA11y-Ref Objective',
    VideoA11yRefAccurate: 'VideoA11y-Ref Accurate', VideoA11yRefClear: 'VideoA11y-Ref Clear' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const comparisons = tables.filter(t => t[0]?.includes('Qwen-2-VL-Max') && t[1]?.[0].startsWith('Prioritization'));
    if (comparisons.length !== 2) throw new Error('Missing model comparisons');
    const rows = new Map<string, LeaderboardRow>();
    for (const t of comparisons) {
      for (let i=1; i<t[0].length; i++) {
        const label = t[0][i], model = label.replace(/\s*†$/, '');
        const setting = 'Guideline and timing ASR, ' + (label.includes('†') ? 'Gemini-3.5 Flash judge' : 'Gemini-2.5 Flash judge');
        const metrics: Record<string, number> = {};
        const names = ['Prioritization','No Redundancy','On-Screen Text','Timeliness','Audio Overlaps','Audio Coverage','Avg. Silence','VideoA11y-Ref Descriptive','VideoA11y-Ref Objective','VideoA11y-Ref Accurate','VideoA11y-Ref Clear'];
        for (const [j, name] of names.entries()) {
          const r = t[j+1];
          if (!r?.[0].startsWith(name)) throw new Error('Missing metric ' + name);
          const [value, margin] = r[i].split(/\s+\\pm\s+/).map(numberCell);
          if (margin === undefined) throw new Error('Missing confidence interval');
          const key = name.replace(/[^a-z0-9]/gi,'');
          metrics[key] = value;
          metrics[key+'Margin95'] = margin;
        }
        const score = metrics.Prioritization, margin = metrics.PrioritizationMargin95;
        const row = {model, setting, score, low: +(score-margin).toFixed(2), high: +(score+margin).toFixed(2), metrics};
        const previous = rows.get(model);
        if (previous && previous.score !== score) throw new Error('Repeated model has a different headline');
        rows.set(model, row);
      }
    }
    return checked([...rows.values()], 9);
  },
};
export default board;
