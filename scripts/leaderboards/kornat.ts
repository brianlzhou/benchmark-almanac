// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// KorNAT measures Korean social value alignment and common knowledge. The organizers rank these tracks by SVA
// and accuracy respectively. Their public Space exposes both tables with scores rounded to three decimal places.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://jiyounglee0523-leaderboard.hf.space/config';
const url = 'https://huggingface.co/spaces/jiyounglee0523/leaderboard';
type Table = {headers: string[]; data: (string | number)[][]};
const subjects = ['Common Sense', 'English', 'Korean', 'Korean History', 'Mathematics', 'Science', 'Social Studies'];
const board: Leaderboard = {
  benchmark: 'kornat', url, feed, terms: 'The Space lists MIT at ' + url + '/blob/main/README.md.',
  headline: 'The leaderboard reports no overall score, so this is the plain mean of Social Values and Common Knowledge.',
  parts: { social: 'Social Values', knowledge: 'Common Knowledge', ...Object.fromEntries(subjects.map(s => [s, s])) },
  verified: 'Organizers ran the model with the official harness.',
  async fetch() {
    const config = await fetchJson<{components: {type: string; props: {value: Table}}[]}>(feed);
    const tables = config.components.filter(c => c.type === 'dataframe').map(c => c.props.value);
    function records(column: string, required: string[]) {
      const table = tables.find(t => t.headers.includes(column));
      if (!table || !['Model', 'Verified', 'Submitter', 'Link', 'Date', ...required].every(h => table.headers.includes(h)))
        throw new Error('Missing KorNAT columns for ' + column);
      return table.data.map(row => Object.fromEntries(table.headers.map((h, i) => [h, row[i]])));
    }
    function pct(raw: string | number) {
      if (raw == null || raw === '' || !Number.isFinite(Number(raw))) throw new Error('Invalid KorNAT result');
      return Number(raw) * 100;
    }
    const social = new Map(records('SVA ↑', ['A-SVA ↑', 'N-SVA ↑', 'Refusal %']).map(r => [r.Model, r]));
    const knowledge = records('Accuracy ↑', subjects);
    return checked(knowledge.flatMap(k => {
      const s = social.get(k.Model);
      if (!s) return [];
      const sva = pct(s['SVA ↑']), accuracy = pct(k['Accuracy ↑']);
      const metrics = { social: sva, knowledge: accuracy, asva: pct(s['A-SVA ↑']), nsva: pct(s['N-SVA ↑']),
        refusalPct: Number(s['Refusal %']), ...Object.fromEntries(subjects.map(subject => [subject, pct(k[subject])])) };
      return [{ model: String(k.Model), score: (sva + accuracy) / 2, metrics, submitter: String(k.Submitter),
        verified: k.Verified === 'official ✓' && s.Verified === k.Verified, date: String(k.Date),
        link: String(k.Link).startsWith('https://') ? String(k.Link) : undefined }];
    }), 20);
  },
};
export default board;
