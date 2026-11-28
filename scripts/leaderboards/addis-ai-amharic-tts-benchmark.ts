// Addis AI asks native speakers to rate Amharic speech on three listening axes.
// The headline is their mean on a five-point scale. The public page also gives recognition errors, costs and latency.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const url = 'https://addisassistant.com/benchmarks/addis-voice-2-amharic';
const board: Leaderboard = {
  benchmark: 'addis-ai-amharic-tts-benchmark', url, feed: url,
  terms: 'Addis AI publishes its benchmark data under CC BY-SA 4.0. Its robots.txt allows the benchmark page.',
  aliases: { 'OpenAI gpt-4o-mini-tts': 'gpt-4o-mini-tts' },
  parts: { naturalness: 'Naturalness', intelligibility: 'Intelligibility', voiceQuality: 'Voice quality' },
  costPer: 'run',
  stats: {
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    latencyP95: { name: '95th percentile latency', unit: 'seconds', better: 'lower' },
    meanRTF: { name: 'Mean real-time factor', unit: 'speedup', better: 'lower' },
    failures: { name: 'Failures', unit: 'count', better: 'lower' },
    cer: { name: 'Character error rate', unit: '%', better: 'lower' },
    wer: { name: 'Word error rate', unit: '%', better: 'lower' },
  },
  async fetch() {
    const all = tables(await fetchText(url)).map(t => t.map(r => r.map(c => c.text)));
    function table(...header: string[]) {
      const found = all.find(t => t[0]?.join('|') === header.join('|'));
      if (!found) throw new Error('Missing Addis AI table: ' + header.join(', '));
      return found.slice(1);
    }
    const listening = table('System', 'Composite', 'n', 'Naturalness', 'Intelligibility', 'Voice quality');
    const timing = table('System', 'n', 'p50', 'p95', 'Mean RTF', 'Failures', 'Serving');
    const costs = table('Provider', 'Billing unit', 'Rate', 'Per generated audio minute', 'Recorded in this run');
    const errors = table('System', 'n', 'CER', '95% CI', 'WER', '95% CI', 'Strict full set CER / WER');
    if (listening.length < 6) throw new Error('Expected at least six listening scores');
    function number(cell: string | undefined) {
      const value = num(cell);
      if (value === undefined) throw new Error('Missing Addis AI measurement');
      return value;
    }
    return listening.map(([model, composite, clips, naturalness, intelligibility, quality]) => {
      const time = timing.find(r => r[0] === model);
      const price = costs.find(r => r[0] === model);
      const error = errors.find(r => r[0] === model);
      const tokens = price?.[4].match(/([\d,]+) output tokens/);
      return {
        model, score: number(composite), date: '2026-08-12',
        cost: price?.[4].startsWith('USD ') ? number(price[4]) : undefined,
        tokens: tokens ? number(tokens[1]) / number(clips) : undefined,
        metrics: { naturalness: number(naturalness), intelligibility: number(intelligibility),
          voiceQuality: number(quality), latency: number(time?.[2]), latencyP95: number(time?.[3]),
          meanRTF: number(time?.[4]), failures: number(time?.[5]), cer: number(error?.[2]), wer: number(error?.[4]) },
      };
    });
  },
};
export default board;
