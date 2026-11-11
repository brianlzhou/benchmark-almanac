// LLM Chess. maxim-saplin.github.io/llm_chess (GitHub Pages) builds its leaderboard from data.js, which holds
// the results CSV in a template string: per player (a model id with its reasoning setting appended,
// "gpt-6-astra-high") the first game date, games against the random player and the Dragon engine, win and
// mistake rates, average cost per game and Elo with its 95% margin. Elo, the board's primary metric since
// May 2025 (anchored on Dragon skill levels), is the score. Players without an Elo are skipped. The first
// game date is passed as the run date; the average game cost is the cost per task. Player ids carry the
// setting in several spellings ("claude-opus-4_thinking_16000", "claude-sonnet-4-6_thinking-high",
// "grok-4-fast-non-reasoning", Bedrock prefixes like "meta.", the Cursor CLI as "cursor_cli_"); norm() turns
// them into a model name, a setting and a harness. Each row also keeps the Elo's 95% margin ("ci") and the
// table's Tokens column, completion tokens per move ("moveTokens"), in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://maxim-saplin.github.io/llm_chess/';

function norm(player: string): { model: string; setting?: string; harness?: string } {
  let m = player.split('@')[0].trim(); // "qwen3.5-4b-thinking@bf16": drop the precision tag
  let setting: string | undefined;
  let harness: string | undefined;
  if (/^cursor_cli_/.test(m)) {
    harness = 'Cursor CLI';
    m = m.replace(/^cursor_cli_/, '');
  }
  m = m.replace(/^(zai|meta|amazon|anthropic|mistral|cohere)\./, ''); // Bedrock-style vendor prefix
  m = m.replace(/-v\d+:\d+$/, ''); // Bedrock version tag ":0"
  let x: RegExpMatchArray | null;
  if ((x = m.match(/[-_](?:adaptive-)?thinking[-_](\d+)$/))) setting = `thinking ${x[1]}`;
  else if ((x = m.match(/[-_](?:adaptive-)?thinking[-_](minimal|low|medium|high|xhigh|max)$/))) setting = x[1];
  else if ((x = m.match(/[-_]non-reasoning$/i))) setting = 'non-reasoning';
  if (x) m = m.slice(0, x.index);
  m = m.replace(/_/g, '-');
  const effort=m.match(/-(minimal|low|medium|high|xhigh|max)$/i);
  if(effort){setting=setting??effort[1].toLowerCase();m=m.slice(0,effort.index);}
  const precision=player.split('@')[1];
  return { model: m, setting: [setting,precision?'precision '+precision:undefined].filter(Boolean).join('; ')||undefined, harness };
}

const board: Leaderboard = {
  benchmark: 'llm-chess',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE}data.js (results CSV, elo)`,
  terms: 'Static data file on GitHub Pages (no robots.txt rules); the maxim-saplin/llm_chess repository is Apache-2.0.',
  chart:{title:'Cost/Game versus Elo',x:{key:'cost',label:'Cost per game',unit:'$',better:'lower',log:true},y:{key:'score',label:'Elo',unit:'elo',better:'higher'},note:'The source compares game cost and Elo. Completion tokens remain a separate per-move metric.'},
  aliases: {
    // dated snapshots the resolver would move to a later snapshot by run date
    'gpt-4o-2024-05-13': 'gpt-4o-may-2024',
    'gpt-4o-2024-08-06': 'gpt-4o-aug-2024',
    'gpt-4o-2024-11-20': 'gpt-4o-nov-2024',
    'gemini-2.5-pro-preview-05-06': 'gemini-2-5-pro-may-2025',
    'qwen-3-235b-a22b-instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'claude-3-5-sonnet-v2': 'claude-3-5-sonnet-october-2024',
    // the -001 Gemini builds: 1.5 Flash of May 2024, 2.0 Flash and Flash-Lite of February 2025
    'gemini-1.5-flash-001': 'gemini-1-5-flash-may-2024',
    'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
    'gemini-2.0-flash-lite-001': 'gemini-2-0-flash-lite',
    'llama-4-maverick-17b-128e-instruct': 'llama-4-maverick',
    'llama4-scout-17b-instruct': 'llama-4-scout',
    // the original July 2025 Kimi K2 Instruct
    'kimi-k2-instruct': 'kimi-k2-jul-2025',
    // gpt-5.1-chat-latest serves GPT-5.1 Instant
    'gpt-5.1-chat': 'gpt-5-1-instant',
    'gemma-2-9b-it-8bit': 'gemma-2-9b',
    'gemma-2-27b-it': 'gemma-2-27b',
    'llama-3-70b-instruct-awq': 'llama-3-70b',
    'inception-mercury-3': 'mercury-3',
    'muse-glimmer-30b': 'muse-glimmer',
  },
  async fetch() {
    const js = await fetchText(`${PAGE}data.js`);
    const csv = js.match(/`([\s\S]*?)`/)?.[1];
    if (!csv) throw new Error('no results CSV in data.js');
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(csv.trim())) {
      // Preserve community quantizations as distinct unlisted configurations.

      const elo = r.elo === '' ? NaN : Number(r.elo);
      if (!r.Player || !Number.isFinite(elo)) continue;
      const cost = Number(r.average_game_cost);
      const metrics: Record<string, number> = {};
      for(const [key,value] of Object.entries(r)) {
        if(key==='Player'||key==='min_game_date'||!value.trim())continue;
        const numeric=Number(value);
        if(Number.isFinite(numeric))metrics[key]=numeric;
      }
      const ci = r.elo_moe_95 === '' ? NaN : Number(r.elo_moe_95);
      const moveTokens = r.completion_tokens_black_per_move === '' ? NaN : Number(r.completion_tokens_black_per_move);
      if (Number.isFinite(ci)) metrics.ci = ci;
      if (moveTokens > 0) metrics.moveTokens = moveTokens;
      rows.push({
        ...(/^unsloth\//i.test(r.Player)?{model:r.Player+' [community quantization]'}:norm(r.Player)),
        score: Number(elo.toFixed(1)),
        date: r.min_game_date || undefined,
        cost: cost > 0 ? cost : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
