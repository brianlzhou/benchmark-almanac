// Do You See Me: Table 4 publishes 2D and 3D average accuracies over the full benchmark.
// Footnote 2 defines the headline: "Macro Average of 2D and 3D performance".
// Compute that explicitly defined plain mean, keeping the two published averages as metrics.
// Standard deviations are subscripts and are not part of the accuracy. SFT results cover only 2D and are excluded.
// These are static paper results and will not refresh with new models. Undated API snapshots remain unlisted.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { tables, text } from '../lib/html.ts';

const FEED = 'https://arxiv.org/html/2506.02022';
const board: Leaderboard = {
  benchmark: 'do-you-see-me', url: 'https://github.com/microsoft/Do-You-See-Me', feed: FEED, terms: PAPER_TERMS,
  aliases: { 'O3 (2025-04-16)': 'o3', 'Phi-4-Multimodal-Instruct-5.7B': 'phi-4-multimodal' },
  async fetch() {
    const html = await paperHtml(FEED);
    if (!text(html).includes('Macro Average of 2D and 3D performance')) throw new Error('Do You See Me overall definition changed');
    // The two header rows contain nested layout tables. Read the flat data rows after those headers.
    const start = html.indexOf('<tr id="S5.T4.2.1.3"');
    const end = html.indexOf('</table>', start);
    if (start < 0 || end < 0) throw new Error('Do You See Me full results table missing');
    const table = tables('<table>' + html.slice(start, end) + '</table>')[0];
    const rows = table.map(c => {
      if (c.length !== 15) throw new Error('Do You See Me table shape changed');
      const value = (i: number) => numberCell(text(c[i].html.replace(/<sub\b[\s\S]*?<\/sub>/gi, '')));
      let model = c[0].text;
      if (/Claude|GPT-4o|Gemini/.test(model)) model += ' (snapshot unspecified)';
      const acc2d = value(8), acc3d = value(14);
      return { model, score: Number(((acc2d + acc3d) / 2).toFixed(3)), metrics: { acc2d, acc3d } };
    });
    if (rows.length !== 12) throw new Error('Do You See Me model count changed');
    return rows;
  },
};
export default board;
