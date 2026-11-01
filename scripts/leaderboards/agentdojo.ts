// AgentDojo (ETH Zurich SPY Lab and Invariant Labs). agentdojo.spylab.ai/results/ is a static MkDocs page
// built from the repository's results; its table lists per model, defense and attack the utility, the
// utility under attack and the targeted attack success rate (ASR, 0 to 100, lower is better). The almanac
// records AgentDojo as attack success rate, so Targeted ASR is the score. The standard setup is no defense
// with the important_instructions attack; rows with another defense or attack keep it as the setting.
// Model ids carry their snapshot date, which is passed on. The table has not changed since February 2025.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://agentdojo.spylab.ai/results/';

const board: Leaderboard = {
  benchmark: 'agentdojo',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Targeted ASR)`,
  terms: 'Static documentation page built from the AgentDojo repository, which is MIT-licensed.',
  aliases: {
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'gemini-2.0-flash-exp': 'gemini-2-0-flash-dec-2024',
    'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
    'gemini-1.5-pro-001': 'gemini-1-5-pro-may-2024',
    'gemini-1.5-flash-001': 'gemini-1-5-flash-may-2024',
    'gemini-1.5-pro-002': 'gemini-1-5-pro-sept-2024',
    'gemini-1.5-flash-002': 'gemini-1-5-flash-sep-2024',
    'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'Llama-3-70b-chat-hf': 'llama-3-70b',
  },
  async fetch() {
    const [t] = tables(await fetchText(PAGE));
    const head = t?.[0]?.map((c) => c.text);
    const [model, defense, attack, asr, date] = ['Model', 'Defense', 'Attack', 'Targeted ASR', 'Date'].map((h) => head?.indexOf(h) ?? -1);
    if ([model, defense, attack, asr].some((i) => i < 0)) throw new Error(`unexpected AgentDojo header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const score = num(r[asr]?.text);
      const name = r[model]?.text;
      if (!name || score === undefined) continue;
      const settings: string[] = [];
      const d = r[defense]?.text;
      const a = r[attack]?.text;
      if (d && d !== 'None') settings.push(`defense: ${d}`);
      if (a && a !== 'important_instructions') settings.push(`attack: ${a}`);
      const stamp = name.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
      rows.push({
        model: name,
        score,
        setting: settings.join(', ') || undefined,
        date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : date >= 0 ? r[date]?.text : undefined,
      });
    }
    return rows;
  },
};
export default board;
