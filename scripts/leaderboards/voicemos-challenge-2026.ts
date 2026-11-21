// VoiceMOS evaluates predictors of subjective speech ratings. Its tracks mix correlations, errors and accuracy.
// The headline is the first primary metric in section 4.1, utterance-level Spearman correlation for absolute ratings.
// The organizers identify B01's checkpoint and T01's two feature encoders in sections 3 and 5.1.
// T09 combines 29 scores without identifying every constituent. The other first-track teams give no model name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://docs.google.com/spreadsheets/d/1jmgIGHRvuP9XvYQif6ChjdT6vZ0ZgraHv7TP_xQjBiU';
const feed = url + '/export?format=csv&gid=0';
const metrics = ['MSE','LCC','SRCC','KTAU','MSE','LCC','SRCC','KTAU','ACC-TIE','ACC-STRICT'];
const names = ['ACR','CCR'];
const board: Leaderboard = {
  benchmark:'voicemos-challenge-2026', url:url+'/edit', feed,
  terms:'The VoiceMOS organizers publish the workbook at https://sites.google.com/view/voicemos-challenge/voicemos-challenge-2026.',
  headline:'The challenge has no overall score. This is the Track 1 utterance-level Spearman correlation for absolute category ratings.',
  parts:Object.fromEntries(metrics.map((name,i) => [names[Number(i>=4)]+name.replace('-',''),{
    group:names[Number(i>=4)],name,unit:'score',better:name==='MSE'?'lower':'higher'}])),
  async fetch() {
    const rows = (await fetchText(feed)).trim().split(/\r?\n/).map(l=>l.split(','));
    if (rows[3]?.slice(1,11).join()!==metrics.join() || rows[1][1]!=='ACR' || rows[1][5]!=='CCR') throw new Error('Missing Track 1 metrics');
    const result: LeaderboardRow[] = [];
    for (const [id,...cells] of rows.slice(4)) {
      if (!['B01','T01'].includes(id)) continue;
      const values = cells.slice(0,10);
      if (values.length!==10 || values.some(x=>!x.trim() || !Number.isFinite(Number(x)))) throw new Error('Missing Track 1 score');
      const row: LeaderboardRow = {model:'urgent-mos-f1c1m5dcorpus',submitter:'VoiceMOS organizers',score:Number(values[2]),
        metrics:Object.fromEntries(metrics.map((name,i)=>[names[Number(i>=4)]+name.replace('-',''),Number(values[i])]))};
      if (id==='T01') {
        row.model='wav2vec 2.0 large robust + MERT';
        row.models=['wav2vec 2.0 large robust','MERT'];
        row.submitter='T01';
      }
      result.push(row);
    }
    return checked(result,2);
  },
};
export default board;
