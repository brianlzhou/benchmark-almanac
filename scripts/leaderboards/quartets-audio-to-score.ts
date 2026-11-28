// Quartets measures audio-to-score transcription on the published test split. Read word error rates for blind and staves-informed systems from the MIREX wiki.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://futuremirex.com/mirex/wiki/2026:Audio-to-Score_Transcription_Results#Quartets_test_set_2";
const board: Leaderboard = {
  benchmark: "quartets-audio-to-score",
  url: "https://futuremirex.com/mirex/wiki/2026:Audio-to-Score_Transcription_Results#Quartets_test_set_2",
  feed: FEED,
  terms: "The wiki lists the GNU Free Documentation License 1.2 for its content. https://futuremirex.com/mirex/wiki/2026:Audio-to-Score_Transcription_Results The host has no published robots directives at /robots.txt.",
  parts: { cer: { name: 'CER', unit: 'score', better: 'lower' }, ler: { name: 'LER', unit: 'score', better: 'lower' }, mv2h: { name: 'MV2H', better: 'higher' } },
  stats: { realTimeFactor: { name: 'Real-time factor', unit: 'score', better: 'lower' } },
  async fetch() {
    const html = await fetchText(FEED);
    const roster = tables(html).find(t => t[0]?.[0]?.text === 'Team');
    return [['Quartets_test_set','Staves-Informed',1], ['Quartets_test_set_2','Blind',2]].flatMap(([anchor,setting,min]) => {
      const section = html.split('id="' + anchor + '"')[1]?.split(/<h[23][ >]/)[0] ?? '';
      const table = tables(section).find(t => t[0].map(c => c.text).join('|') === 'Submission|WER|CER|LER|MV2H');
      if (!table || table.length <= Number(min)) throw new Error('Missing ' + setting + ' entries');
      return table.slice(1).map(([name,...cells]) => {
        const [score,cer,ler,mv2h] = cells.map(c => c.text ? Number(c.text) : NaN);
        if (!name.text || ![score,cer,ler,mv2h].every(Number.isFinite)) throw new Error('Invalid transcription result');
        const info = roster?.find(r => r[0].text === name.text);
        return { model: name.text, submitter: name.text, setting: String(setting), score, params: info?.[4]?.text.match(/^([\d.]+)M/) ? parseFloat(info[4].text) / 1000 : undefined,
          metrics: { cer, ler, mv2h, ...(info?.[6]?.text ? { realTimeFactor: Number(info[6].text) } : {}) },
          link: info?.[1].html.match(/href="([^"]+)"/)?.[1] };
      });
    });
  },
};
export default board;
