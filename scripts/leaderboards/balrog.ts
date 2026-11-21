// BALROG. balrogai.com is a static page with two leaderboard tables: the LLM board (language input, with
// TextWorld) and the VLM board (image input, no TextWorld). Use the default LLM board: % Progress
// (mean progress over the environments, 0 to 100, with reported spreads retained) is the score and the Date column
// the row date. The VLM board uses another environment set and is excluded. Names carry medal and status emoji, which are dropped. A "-Max" suffix
// ("Claude-Opus-5-Max") marks the maximum effort setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://balrogai.com/';

const unspecified = (name: string) => /^(?:gpt4o|gpt4|gpt4turbo|gpt4v|gpt35turbo|gemini(?:15|20|25)(?:pro|flash|flashlite|flashthinking)|claude35sonnet|deepseek(?:r1|v3))$/i.test(name.replace(/[- ._]/g, '')) ? `${name} (snapshot unspecified)` : name;

const board: Leaderboard = {
  benchmark: 'balrog',
  parts: {
    BabyAI: { name: 'BabyAI', group: 'Environment' },
    Crafter: { name: 'Crafter', group: 'Environment' },
    TextWorld: { name: 'TextWorld', group: 'Environment' },
    BabaIsAI: { name: 'BabaIsAI', group: 'Environment' },
    MiniHack: { name: 'MiniHack', group: 'Environment' },
    NetHack: { name: 'NetHack', group: 'Environment' },
  },
  verified: 'The BALROG team accessed the submission and reproduced its generations',
  url: URL,
  feed: `${URL} (default LLM board, % Progress)`,
  terms: 'Static public page; the site publishes no robots.txt and no terms, and the BALROG repository is MIT-licensed.',
  stats: { progressSpread:{name:'Progress spread',unit:'score'}, BabyAISpread:{name:'BabyAI spread',unit:'score'}, CrafterSpread:{name:'Crafter spread',unit:'score'}, TextWorldSpread:{name:'TextWorld spread',unit:'score'}, BabaIsAISpread:{name:'BabaIsAI spread',unit:'score'}, MiniHackSpread:{name:'MiniHack spread',unit:'score'}, NetHackSpread:{name:'NetHack spread',unit:'score'} },
  aliases: {
    'Gemini-1.5-Pro-002': 'gemini-1-5-pro-sept-2024',
    'Gemini-1.5-Flash-002': 'gemini-1-5-flash-sep-2024',
    'Microsoft-Phi-4': 'phi-4',
    'Mistral-Nemo-2407': 'mistral-nemo',
  },
  async fetch() {
    const all = tables(await fetchText(URL)).filter(t => t[0]?.some(c=>c.text==='% Progress'));
    if (all.length < 2) throw new Error('BALROG language or vision table missing');
    const rows: LeaderboardRow[] = [];
    for (const t of all.filter(t => t[0].some(c => c.text === 'TextWorld'))) {
    const head = t[0].map((c) => c.text);
    const [iScore, iDate] = [head.indexOf('% Progress'), head.indexOf('Date')];
    for (const r of t.slice(1)) {
      // emoji dropped, and "-it" (instruction-tuned) is the board's tag for the chat model
      let name = (r[0]?.text ?? '').replace(/[^\p{L}\p{N}().\-_ ]/gu, '').trim().replace(/-it\b/, '');
      const max = /-Max$/i.test(name);
      if (max) name = name.replace(/-Max$/i, '');
      const score = num(r[iScore]?.text);
      const date = r[iDate]?.text;
      if (!name || score === undefined) continue;
      const metrics: Record<string,number> = {};
      for (let i=iScore;i<iDate;i++) {
        const [value,spread]=r[i].text.split('±');
        const n=num(value), uncertainty=num(spread);
        if (i!==iScore && n!==undefined) metrics[head[i]]=n;
        if (uncertainty!==undefined) metrics[(i===iScore?'progress':head[i])+'Spread']=uncertainty;
      }
      if (r[0].text.includes('🕹')) metrics.openCode=1;
      rows.push({ model: unspecified(name), score, metrics, verified:r[0].text.includes('✔') || undefined, setting: [head.includes('TextWorld') ? 'language input' : 'vision input', max ? 'max' : ''].filter(Boolean).join('; '), date: /^\d{4}-\d\d-\d\d$/.test(date ?? '') ? date : undefined });
    }
    }
    return rows;
  },
};
export default board;
