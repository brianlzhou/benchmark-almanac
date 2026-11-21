// CAE-bench measures whether language-model agents can complete engineering simulation tasks.
// The score is the equal-weighted mean of the four domain means, on a 0 to 1 scale.
// This importer reads the generated overall and domain board from the public project page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://cae-bench.svdailab.com/';

function strip(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
}

const board: Leaderboard = {
  benchmark: 'hwe-bench-cae',
  url,
  feed: url,
  terms: 'The project publishes this generated leaderboard page under its public Apache 2.0 repository terms. https://github.com/svd-ai-lab/cae-bench/blob/main/LICENSE',
  parts: {
    combustion: { name: 'Combustion', group: 'Domain' },
    battery: { name: 'Battery', group: 'Domain' },
    cfd: { name: 'CFD', group: 'Domain' },
    packaging: { name: 'Packaging', group: 'Domain' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(url);
    const rows: LeaderboardRow[] = [];
    const overall = /<div class="row" title="([^"]+?) — ([0-9.]+), 95% interval ([0-9.]+)–([0-9.]+)">\s*<div class="name">([^<]+)<\/div>/g;
    for (const match of html.matchAll(overall)) {
      const [, , scoreText, lowText, highText, modelText] = match;
      rows.push({ model: strip(modelText), score: Number(scoreText), low: Number(lowText), high: Number(highText), harness: 'terminus-2' });
    }
    if (rows.length < 2) throw new Error('CAE-bench overall rows missing');

    const detailStart = html.indexOf('<!-- BOARDGRID:BEGIN');
    const detailEnd = html.indexOf('<!-- BOARDGRID:END -->');
    if (detailStart < 0 || detailEnd < 0) throw new Error('CAE-bench domain board missing');
    const detail = html.slice(detailStart, detailEnd);
    const panel = /<figure class="gpanel">\s*<figcaption>([^<]+)<span class="gsub">[^<]*<\/span><\/figcaption>([\s\S]*?)<\/figure>/g;
    for (const panelMatch of detail.matchAll(panel)) {
      const partName = strip(panelMatch[1]);
      const key = partName.toLowerCase();
      const body = panelMatch[2];
      const cells = /<div class="gbar(?: galt)?">\s*<div class="glabel(?: galt-label)?">([^<]+)<\/div>[\s\S]*?<div class="gval">([0-9.]+)<\/div>/g;
      for (const cell of body.matchAll(cells)) {
        const model = strip(cell[1]).replace(/^↳ same model, /, '');
        const row = rows.find((candidate) => candidate.model === model);
        if (row) row.metrics = { ...(row.metrics ?? {}), [key]: Number(cell[2]) };
      }
    }
    if (rows.some((row) => !row.metrics || Object.keys(row.metrics).length !== 4)) throw new Error('CAE-bench domain scores missing');
    return rows;
  },
};

export default board;
