// Open ASR paper: English short-form Avg. WER, lower is better.
// These static paper rows will not refresh. Multilingual and long-form tables are excluded. RTFx is a secondary metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2510.06961";
const board: Leaderboard = {
  benchmark: "open-asr-leaderboard",
  url: "https://arxiv.org/html/2510.06961",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  aliases: {
    'Cohere Labs Transcribe': 'cohere-transcribe-03-2026',
    'Microsoft Phi 4 Multimodal Instruct': 'phi-4-multimodal',
    'Mistral AI Voxtral Small 24B': 'voxtral-small',
  },
  chart: {"title": "WER versus RTFx", "x": {"key": "rtfx", "label": "Real-time factor", "better": "higher"}, "y": {"key": "score", "label": "Word error rate", "unit": "%", "better": "lower"}},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text.includes('Encoder')) && t[0]?.some(c=>c.text.includes('WER')));
      if(!t) throw new Error('Open ASR English table missing');
      return t.slice(1).filter(r=>num(r[2]?.text)!==undefined).map(r=>({model:r[0].text,score:num(r[2].text)!,metrics:num(r[3].text)!==undefined?{rtfx:num(r[3].text)!}:undefined}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
