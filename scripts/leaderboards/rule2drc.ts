// Rule2DRC ranks models by public-set success rate. Its HTML attributes provide success and error rates with and without documentation.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://jinukkim.me/blog/rule2drc/leaderboard/";
const board: Leaderboard = {
  benchmark: "rule2drc",
  url: "https://jinukkim.me/blog/rule2drc/leaderboard/",
  feed,
  terms: "The repository uses MIT and the dataset uses Apache 2.0. The leaderboard states no separate score license. The host returns 404 for robots.txt.",
  parts: { error: { name:'Public error', better:'lower' }, privateSuccess:'Private success', privateError:{name:'Private error',better:'lower'} },
  async fetch() {
    const html = await fetchText(feed);
    const rows = [...html.matchAll(/<tr\s+(data-model=[^>]+)>([\s\S]*?)<\/tr>/g)].flatMap(([,attrs,body]) => {
      const r = Object.fromEntries([...attrs.matchAll(/data-([\w]+)="([^"]*)"/g)].map(m => [m[1],m[2]]));
      const meta = text(body.match(/class="meta">([^<]*)/)?.[1] ?? '').split(/&middot;|·/)[0].trim();
      return ['ctx','noctx'].map(mode => {
        const read = (k:string) => {
          if (!(k in r)) throw new Error('Missing Rule2DRC column ' + k);
          if (!r[k]) return undefined;
          if (!Number.isFinite(Number(r[k]))) throw new Error('Invalid ' + k);
          return Number(r[k]);
        };
        const score = read('s_'+mode), error = read('e_'+mode);
        if (score == null || error == null) throw new Error('Missing public score');
        const priv = read('s_p'+mode), privError = read('e_p'+mode);
        const settings = [mode === 'ctx' ? 'Docs in context' : 'No context'];
        const reasoning = meta.split(';')[0];
        if (reasoning && !/^\d{4}-/.test(reasoning)) settings.push(reasoning);
        if (mode === 'ctx' && meta.includes('9.8K')) settings.push('9.8K output cap');
        if (mode === 'noctx' && meta.includes('OpenRouter')) settings.push('OpenRouter');
        return { model: r.model, setting: settings.join(', '), score, metrics: { error,
          ...(priv != null ? { privateSuccess:priv } : {}), ...(privError != null ? { privateError:privError } : {}) } };
      });
    });
    if (rows.length < 24) throw new Error('Incomplete Rule2DRC board');
    return rows;
  },
};
export default board;
