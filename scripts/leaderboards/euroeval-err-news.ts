// EuroEval measures Estonian news summarization with CHRF3++. The Estonian generative leaderboard embeds its CSV in a JavaScript asset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://euroeval.com/leaderboards/estonian";

const board: Leaderboard = {
  benchmark: "euroeval-err-news",
  url: "https://euroeval.com/leaderboards/estonian",
  feed,
  terms: "EuroEval publishes its code under MIT. TalTech lists CC BY 4.0 for the source dataset. The scoreboard gives no separate score license. https://github.com/EuroEval/EuroEval https://huggingface.co/datasets/TalTechNLP/ERRnews The feed host publishes robots.txt at https://euroeval.com/robots.txt.",
  stats: {
    chrf4: { name: 'Character n-gram F4 score', unit: 'score', better: 'higher' },
    scored: { name: 'Scored items', unit: 'count' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const main = /<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(html)?.[1];
    if (!main) throw new Error('Missing EuroEval application bundle');
    const indexUrl = new URL(main, feed);
    const index = await fetchText(indexUrl.href);
    const chunk = /(?:assets\/|\.\/)(estonian_generative-[^".]+\.js)/.exec(index)?.[1];
    if (!chunk) throw new Error('Missing EuroEval Estonian bundle');
    const source = await fetchText(new URL(chunk, indexUrl).href);
    const start = source.indexOf('Rank,Model,');
    if (start < 0) throw new Error('Missing embedded leaderboard CSV');
    const records = parseCsv(source.slice(start).split(String.fromCharCode(96))[0]);
    const key = Object.keys(records[0] ?? {}).find(name => text(name) === 'err_news');
    if (!key) throw new Error('Missing ERRNews column');
    const rows: LeaderboardRow[] = [];
    for (const record of records) {
      if (record[key] === '-') continue;
      const values = record[key].match(/^([\d.]+) ± ([\d.]+) \/ ([\d.]+) ± ([\d.]+)$/);
      const label = text(record.Model);
      const setting = label.match(/ \(([^()]*)\)$/);
      if (!values || !label) throw new Error('Malformed ERRNews entry: ' + record[key]);
      const score = Number(values[1]), width = Number(values[2]);
      rows.push({ model: setting ? label.slice(0, setting.index) : label, setting: setting?.[1], score, low: score - width, high: score + width,
        link: record.Model.match(/href=['"]([^'"]+)/)?.[1], open: record.Open === '✓', metrics: { chrf4: Number(values[3]), scored: Number(record.err_news_scored) } });
    }
    if (rows.length < 225) throw new Error('Incomplete ERRNews results');
    return rows;
  },
};
export default board;
