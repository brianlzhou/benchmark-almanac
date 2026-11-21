// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// The IIT Madras final standings give best word error rates for Indian English, Hindi and Tamil.
// We join a team's results only within the same track and named acoustic model family. Lower WER is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://sites.google.com/view/indian-language-asrchallenge/leaderboard';
const languages = ['English','Hindi','Tamil'];
function acousticModel(description: string) {
  if (/XLSR-53/i.test(description)) return 'Wav2vec2 (XLSR-53)';
  if (/xlsr/i.test(description)) return 'wav2vec2-xlsr';
  if (/wav2vec?2/i.test(description)) return 'Wav2vec2';
  if (/CNN\+TDNNF LF-MMI/i.test(description)) return 'CNN+TDNNF LF-MMI';
  if (/Basic_Chain_V0_Kaldi/i.test(description)) return 'Basic_Chain_V0_Kaldi';
  if (/tdnn/i.test(description)) return 'Kaldi TDNN';
  if (/kaldi chain|chain model/i.test(description)) return 'Kaldi Chain Model';
}
const board: Leaderboard = {
  benchmark:'iit-madras-hindi-tamil-english-asr', url:feed, feed,
  terms:'IIT Madras publishes the final competition standings. ' + feed,
  parts:Object.fromEntries(languages.map(l => [l,{name:l,unit:'%',better:'lower' as const}])),
  async fetch() {
    const html = await fetchText(feed);
    const blocks = [...html.matchAll(/data-code="([^"]+)"/g)].map(m =>
      m[1].replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&amp;', '&')
    ).filter(b => b.includes('Best Approach'));
    if (blocks.length !== 3) throw new Error('Expected three language boards');
    const rows = new Map<string,LeaderboardRow>();
    blocks.forEach((block,i) => {
      const result = tables(block);
      if (result.length !== 2) throw new Error('Missing open or closed standings');
      result.forEach(([header,...entries],j) => {
        if (header.map(c => c.text).join('|') !== 'Position|Team name|Best Score(WER %)|# Submissions|Best Approach') {
          throw new Error('WER columns changed');
        }
        for (const cells of entries) {
          const [,team,wer,submissions,approach] = cells.map(c => c.text);
          const model = acousticModel(approach);
          if (!model) continue;
          const track = j ? 'Closed task' : 'Open task';
          const key = JSON.stringify([team,track,model]);
          const row = rows.get(key) ?? { model, submitter:team, setting:track + ', ' + team, score:0, metrics:{} };
          if (!/^\d+(\.\d+)?$/.test(wer)) throw new Error('Missing WER for ' + team);
          row.metrics![languages[i]] = Number(wer);
          row.metrics![languages[i]+'Submissions'] = Number(submissions);
          rows.set(key,row);
        }
      });
    });
    const complete = [...rows.values()].filter(r => languages.every(l => Number.isFinite(r.metrics![l])));
    for (const row of complete) row.score = languages.reduce((s,l) => s + row.metrics![l],0)/3;
    return checked(complete, 13);
  },
};
export default board;
