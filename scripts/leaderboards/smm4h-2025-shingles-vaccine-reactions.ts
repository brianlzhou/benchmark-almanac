// The CodaLab test standings rank submissions by F1 for personal vaccine reactions. The HTML includes last-entry dates, submission counts, precision and recall.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://codalab.lisn.upsaclay.fr/competitions/22159/results/37744";

const board: Leaderboard = {
  benchmark: "smm4h-2025-shingles-vaccine-reactions",
  url: "https://codalab.lisn.upsaclay.fr/competitions/22159/results/37744",
  feed,
  terms: "CodaLab publishes scores by username. The results page gives no score reuse license. https://codalab.lisn.upsaclay.fr/competitions/22159/results/37744 The robots URL returns an HTML error page.",
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[1]?.map(c => c.text).join('|') === '#|User|Entries|Date of Last Entry|F1|P|R');
    const rows = t?.filter(c => /^\d+$/.test(c[0]?.text)) ?? [];
    if (rows.length < 9) throw new Error('Missing test submissions');
    return rows.map(c => {
      const [score, precision, recall] = c.slice(4).map(v => num(v.text));
      const d = c[3].text.match(/^(\d\d)\/(\d\d)\/(\d\d)$/);
      if (!d || score === undefined || precision === undefined || recall === undefined) throw new Error('Invalid CodaLab submission');
      return { model:c[1].text, submitter:c[1].text, score, date:'20' + d[3] + '-' + d[1] + '-' + d[2], metrics:{precision, recall, entries:Number(c[2].text)} };
    });
  },
};

export default board;
