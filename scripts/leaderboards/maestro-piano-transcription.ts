// MAESTRO tests piano transcription from recorded performances. OpenCodePapers ranks systems by note onset F1.
// Each row links to its paper. The leaderboard does not distinguish MAESTRO dataset revisions.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://gitlab.com/OpenCodePapers/OpenCodePapers/-/raw/main/dataset/benchmarks/music-transcription-on-maestro.json';
interface Source {
  title: string;
  benchmark: { fields: {key: string, label: string}[], items: {n: string, m1: string, p: {link: string}}[] };
}
const board: Leaderboard = {
  benchmark: 'maestro-piano-transcription', host: 'OpenCodePapers', feed,
  url: 'https://opencodepapers-b7572d.gitlab.io/benchmarks/music-transcription-on-maestro.html',
  terms: 'GitLab hosts the public OpenCodePapers data under its terms. https://about.gitlab.com/terms/',
  async fetch() {
    const { title, benchmark } = await fetchJson<Source>(feed);
    if (title !== 'music-transcription-on-maestro' || !benchmark.fields.some(f => f.key === 'm1' && f.label === 'Onset F1') ||
        !benchmark.fields.some(f => f.key === 'n' && f.label === 'ModelName')) throw new Error('Missing MAESTRO onset F1 table');
    return checked(benchmark.items.filter(row => !/et al\.$/i.test(row.n)).map(row => {
      const mt3 = row.n.match(/^(MT3) \((.+)\)$/);
      return { model: mt3?.[1] ?? row.n, setting: mt3?.[2], score: numberCell(row.m1), link: row.p.link };
    }), 7);
  },
};
export default board;
