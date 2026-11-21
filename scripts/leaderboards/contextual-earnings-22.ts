// Contextual Earnings-22 tests transcription of earnings-call audio with and without vocabulary hints.
// OpenBench reports word error rate for each condition alongside keyword precision, recall and F-score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/argmaxinc/OpenBench/HEAD/BENCHMARKS.md';
const board: Leaderboard = {
  benchmark:'contextual-earnings-22', url:'https://github.com/argmaxinc/OpenBench/blob/main/BENCHMARKS.md#keyword-recognition', feed,
  terms:'The OpenBench repository publishes the tables under its license. https://github.com/argmaxinc/OpenBench/blob/main/LICENSE',
  aliases: {'Whisper OSS (large-v3-turbo)':'whisper-large-v3-turbo','Argmax (qwen3-asr-1.7b)':'qwen3-asr-1-7b'},
  stats:{precision:{name:'Precision',unit:'score',better:'higher',note:'Rate stored from 0 to 1.'},recall:{name:'Recall',unit:'score',better:'higher',note:'Rate stored from 0 to 1.'},f1:{name:'F1',unit:'score',better:'higher',note:'Rate stored from 0 to 1.'}},
  async fetch() {
    const section = (await fetchText(feed)).split('# Keyword Recognition\n')[1];
    if (!section) throw new Error('Missing keyword recognition chapter');
    const rows = new Map<string, LeaderboardRow>();
    for (const [heading, metric] of [['Word Error Rate (WER)','score'],['Precision','precision'],['Recall','recall'],['F-score','f1']]) {
      const table = section.split('## ' + heading + '\n')[1]?.split(/\n##? /)[0].split('\n').filter(l=>l.startsWith('|')).map(l=>l.split('|').slice(1,-1).map(c=>c.trim().replace(/<br\s*\/?>/gi,' ')));
      if (!table || table[0].join('|') !== 'System|earnings22-keywords (no keywords)|earnings22-keywords (chunk-keywords)|earnings22-keywords (file-keywords)') throw new Error('Missing ' + heading);
      for (const [model,...values] of table.slice(2)) {
        values.forEach((cell,i) => {
          if (cell === '-') return;
          if (!/^\d+(\.\d+)?$/.test(cell)) throw new Error('Invalid ' + heading + ' for ' + model);
          const setting = table[0][i+1].match(/\(([^)]+)\)/)![1];
          const key = JSON.stringify([model,setting]);
          if (metric === 'score') rows.set(key, {model,setting,score:Number(cell),metrics:{}});
          else {
            const row = rows.get(key);
            if (!row) throw new Error('Missing WER for ' + model);
            row.metrics![metric] = Number(cell);
          }
        });
      }
    }
    return checked([...rows.values()],28);
  },
};
export default board;
