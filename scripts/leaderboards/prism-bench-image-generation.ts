// PRISM-Bench evaluates generated images. The project tables rank models by Overall Avg for each judge.
// The Chinese benchmark appears in separate tables and supplies additional metrics for the same models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://flux-reason-6m.github.io/";

const groups = ['Overall','Imagination','Entity','Text rendering','Style','Affection','Composition','Long text'];

const board: Leaderboard = {
  benchmark: "prism-bench-image-generation",
  url: "https://flux-reason-6m.github.io/#leaderboard",
  feed: FEED,
  terms: "The authors do not specify separate terms for leaderboard scores on https://flux-reason-6m.github.io/#leaderboard",
  aliases: {
    "SD3.5-Large": "stable-diffusion-3-5-large"
  },
  async fetch() {
    const html = await fetchText(FEED);
    const rows = new Map<string,LeaderboardRow>();
    this.parts = {};
    const tabs = [...html.matchAll(/data-tab="(\d+)"><a>(PRISM-Bench(?:-ZH)?) \(([^)]+)\)<\/a>/g)];
    if (tabs.length !== 4) throw new Error('Unexpected PRISM-Bench tabs');
    for (const [, id, suite, judge] of tabs) {
      const table = tables(html.split('id="leaderboard-tab-' + id + '"')[1])[0];
      const zh = suite.endsWith('-ZH');
      if (table.length < (zh ? 9 : 21) || groups.some((g,i) => table[0][4+i]?.text !== g) || table[1].some((c,i) => c.text !== ['Align','Aes','Avg'][i%3])) throw new Error('Incomplete PRISM-Bench table');
      for (const cells of table.slice(2)) {
        const label = cells[1].text.replace(/[🥇🥈🥉]/gu,'').trim();
        const model = label.replace(/ \[High\]$/, '').replace(/^Bagel-CoT$/, 'Bagel');
        const setting = [judge, label.endsWith('[High]') ? 'High' : label === 'Bagel-CoT' ? 'CoT' : ''].filter(Boolean).join(', ');
        const key = model + '/' + setting;
        const row = rows.get(key) ?? {model, setting, score: NaN, metrics: {}, date: cells[3].text, link: cells[2].html.match(/href="([^"]+)"/)?.[1]};
        if (!zh) row.score = Number(cells[6].text);
        for (const [i,g] of groups.entries()) {
          for (const [j,measure] of ['Align','Aes','Avg'].entries()) {
            const raw = cells[4+3*i+j]?.text;
            if (!raw || !Number.isFinite(Number(raw))) throw new Error('Missing PRISM-Bench value');
            if (!zh && i === 0 && j === 2) continue;
            const k = [zh ? 'zh' : 'en',g,measure].join('_').replace(/ /g,'_');
            row.metrics![k] = Number(raw);
            this.parts[k] = (zh ? 'PRISM-Bench-ZH · ' : '') + g + ' · ' + measure;
          }
        }
        rows.set(key, row);
      }
    }
    if ([...rows.values()].some(r => !Number.isFinite(r.score))) throw new Error('Missing PRISM-Bench overall result');
    return [...rows.values()];
  },
};
export default board;
