// MMTB tests multimedia work in a terminal. The score is the percentage of 105 tasks passing their verifiers.
// Tables 6 and 9 report whole-suite results. Tables 12 through 14 break down Table 3 by capability and category.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.10966';
const mmtbCategories = ['AudioVisualAlignment','CrossFileComparison','MusicUnderstanding','NonSpeechAudio','OnScreenText','ReferenceResolution','SpatialReasoning','SpeakerVoiceIdentity','SpeechProsody','SpeechUnderstanding','TemporalLocalization','VisualPerception','MediaProduction','PerformanceCoaching','EnterpriseCompliance','PersonalEducation','OperationsResearch'];
const board: Leaderboard = {
  benchmark: 'multimedia-terminalbench', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2605.10966.',
  stats: { partial: {name:'Partial success rate',unit:'%',better:'higher'}, totalTokens: {name:'Total tokens',unit:'tokens'}, secondsPerTask: {name:'Seconds per task',unit:'seconds',better:'lower'}, ...Object.fromEntries(mmtbCategories.flatMap(key => [[key+'Partial',{name:key.replace(/([a-z])([A-Z])/g,'$1 $2')+' partial success rate',unit:'%',better:'higher'}],[key+'Cost',{name:key.replace(/([a-z])([A-Z])/g,'$1 $2')+' cost',unit:'usd',better:'lower'}]])) },
  harnesses: 'system',
  aliases: { 'Qwen3.5-122B': 'qwen3-5-122b-a10b', 'Sonnet-4.6': 'claude-sonnet-4-6' },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = paperTables(html).map(grid);
    const main = tables.find(t => t[1]?.join() === 'Harness,Model,Access,Binary,Partial,API,Tokens,Time');
    const masking = tables.find(t => t[0][0] === 'Backbone' && t[0][2]?.startsWith('Binary Success Rate'));
    const splits = tables.filter(t => t[1]?.slice(0,5).join() === 'Backbone,Harness,B,P,$');
    if (!main || !masking || splits.length !== 3) throw new Error('Missing MMTB results');
    const pct = (v: string) => Number((100 * numberCell(v)).toFixed(5));
    const rows: LeaderboardRow[] = main.slice(2).map(([harness, model, setting, binary, partial, api, tokens, time]) => {
      if (!api.startsWith('$') || !tokens.endsWith('k') || !time.endsWith('s')) throw new Error('Unknown MMTB cost units');
      return { harness, model, setting, score: pct(binary), cost: numberCell(api.slice(1)),
        metrics: { partial: pct(partial), totalTokens: numberCell(tokens.slice(0,-1).replaceAll(',', '')) * 1000,
          secondsPerTask: numberCell(time.slice(0,-1)) } };
    });
    board.parts = {};
    for (const t of splits) {
      for (let col = 2; col < t[0].length; col += 3) {
        if (t[1].slice(col,col+3).join() !== 'B,P,$') throw new Error('Unexpected split columns');
        const name = t[0][col].split(' (')[0];
        const key = name.replace(/[^a-zA-Z0-9]/g, '');
        board.parts[key] = { name, group: t[0][2].startsWith('Media Production') ? 'Meta-category' : 'Capability' };
        for (const r of t.slice(2)) {
          const row = rows.find(x => x.model === r[0] && x.harness === r[1]);
          if (!row?.metrics || !r[col+2].startsWith('$')) throw new Error('Invalid split result');
          row.metrics[key] = pct(r[col]);
          row.metrics[key+'Partial'] = pct(r[col+1]);
          row.metrics[key+'Cost'] = numberCell(r[col+2].slice(1));
        }
      }
    }
    for (const [model,harness,binary,partial] of masking.slice(1)) {
      if (harness === 'Terminus-MM w/o modality masking') {
        rows.push({ model, harness: 'Terminus-MM', setting: 'Without modality masking', score: pct(binary), metrics: {partial: pct(partial)} });
      }
    }
    return checked(rows, 24);
  },
};
export default board;
