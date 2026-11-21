// KgCLUE ranks knowledge-graph question answering systems by the mean of object exact match and object F1. The official leaderboard requests twenty submissions per page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { text } from '../lib/html.ts';

const feed = "https://www.cluebenchmarks.com/api/kgclue/";

const board: Leaderboard = {
  benchmark: "kgclue",
  url: "https://www.cluebenchmarks.com/kgclue.html",
  feed,
  terms: "The publisher displays results at https://github.com/CLUEbenchmark/KgCLUE. I could not verify reuse terms. The official leaderboard host has no robots.txt.",
  async fetch() {
    const rows: LeaderboardRow[] = [];
    const ids = new Set<string>();
    let total = 0;
    for (let page = 1; page === 1 || rows.length < total; page++) {
      if (page > 1) await new Promise(resolve => setTimeout(resolve, 1000));
      const form = new FormData();
      form.set('page', String(page));
      const request = () => fetch(feed, { method: 'POST', body: form, signal: AbortSignal.timeout(45000) });
      let res = await request();
      for (let retry = 1; res.status >= 500 && retry <= 3; retry++) {
        await new Promise(resolve => setTimeout(resolve, retry * 2000));
        res = await request();
      }
      if (!res.ok) throw new Error('KgCLUE page ' + page + ' returned ' + res.status);
      const data = await res.json() as { status: number; total: number; data: Record<string, string>[] };
      total = Number(data.total);
      if (!data.status || !Number.isInteger(total) || total < 401 || !data.data.length) throw new Error('Incomplete KgCLUE page');
      for (const r of data.data) {
        if (!r.model || !r.id || ids.has(r.id)) throw new Error('Missing or repeated KgCLUE submission');
        ids.add(r.id);
        const numeric = (k: string) => {
          const s = text(r[k] ?? '');
          if (!s.trim() || !Number.isFinite(Number(s))) throw new Error('Missing KgCLUE ' + k);
          return Number(s);
        };
        const keys = ['EM_All', 'EM_S', 'EM_P', 'EM_O', 'F1_All', 'F1_S', 'F1_P', 'F1_O'];
        rows.push({ model: text(r.model), score: numeric('n_score'), submitter: text(r.team), date: r.date,
          setting: 'Submission ' + r.id, link: /^https?:\/\//i.test(r.url) ? r.url : undefined,
          params: /^\d+(?:\.\d+)?B$/i.test(r.param_desc) ? parseFloat(r.param_desc) : undefined,
          metrics: Object.fromEntries(keys.map(k => [k, numeric(k)])) });
      }
    }
    if (rows.length !== total) throw new Error('Incomplete KgCLUE results');
    return rows;
  },
};

export default board;
