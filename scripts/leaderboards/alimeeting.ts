// AliMeeting tests speaker diarization in Mandarin meetings. Lower diarization error rate is better.
// Table 3 names the main approaches for each team. Its SVG embeds the team codes and scores as text glyphs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2202.03647v2/track1.svg';
const parts = ['2-Speaker','3-Speaker','4-Speaker'];
export default {
  benchmark: 'alimeeting', url: 'https://arxiv.org/html/2202.03647#S3.T3', feed, static: 'paper',
  terms: 'The paper and its license are linked at https://arxiv.org/abs/2202.03647',
  parts: Object.fromEntries(parts.map(name => [name,name])), harnesses: 'system',
  async fetch() {
    const svg = await paperHtml(feed);
    const lines = new Map<string,{ x:number, glyph:string }[]>();
    for (const m of svg.matchAll(/<use data-text="([^"]+)"[^>]+transform="matrix\(([^)]+)\)"/g)) {
      const [,,,,x,y] = m[2].split(',').map(Number);
      const key = y.toFixed(1);
      const line = lines.get(key) ?? [];
      line.push({x,glyph:m[1]});
      lines.set(key,line);
    }
    const rows: LeaderboardRow[] = [];
    for (const line of lines.values()) {
      const read = (left:number,right:number) => line.filter(c => c.x >= left && c.x < right)
        .sort((a,b) => a.x-b.x).map(c => c.glyph).join('');
      const team = read(0,65);
      if (!/^(?:[A-Z]\d\d|Baseline)$/.test(team)) continue;
      if (!read(75,105)) throw new Error('VBx column changed');
      const model = team === 'S76' ? 'DMSNet' : read(150,180) ? 'TS-VAD' : 'VBx';
      const fields = [[610,680],[680,752],[752,825],[825,892]].map(([l,r]) => read(l,r));
      if (!fields.every(v => /^\d+\.\d+$/.test(v))) throw new Error('Invalid DER cells for ' + team);
      rows.push({ model, submitter: team === 'Baseline' ? 'Organizers' : team,
        harness: team === 'Baseline' ? 'VBx baseline' : team + ' diarization system',
        score: Number(fields[3]), metrics: Object.fromEntries(parts.map((k,i) => [k,Number(fields[i])])) });
    }
    return checked(rows,9);
  },
} satisfies Leaderboard;
