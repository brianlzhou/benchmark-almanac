// OpenSUN3D ranks object search systems by mean average precision. The organizers publish three team results in the workshop HTML table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';

const feed = "https://opensun3d.github.io/index_iccv23.html#challengeresults";
const board: Leaderboard = {
  benchmark: "opensun3d-object-instance-search",
  url: "https://opensun3d.github.io/index_iccv23.html#challengeresults",
  feed,
  terms: "The organizers link ARKitScenes data terms but specify no separate terms for the score table. The host returns 404 for robots.txt.",
  parts: { ap50: 'AP_50', ap25: 'AP_25' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[1]?.text === 'Team');
    if (!table || !['mAP','AP_50','AP_25'].every((name,i) => table[0][i+3]?.text.startsWith(name))) throw new Error('Missing AP columns');
    const rows = table.slice(1).map(r => {
      const model = text(r[1].html.split(/<div\b/i)[0]);
      if (!model || r.length !== 6 || r.slice(3).some(c => !c.text || !Number.isFinite(Number(c.text)))) throw new Error('Invalid team result');
      return { model, submitter: model, score: Number(r[3].text), metrics: { ap50: Number(r[4].text), ap25: Number(r[5].text) },
        link: r[2].html.match(/href="([^"]+)"/)?.[1] };
    });
    if (rows.length < 3) throw new Error('Incomplete OpenSUN3D ranking');
    return rows;
  },
};
export default board;
