// Gaia2 (Meta Agents Research Environments), the original 800-scenario benchmark. Its board is the Gradio
// Space meta-agents-research-environments/leaderboard, whose results dataset is private. The Space's
// Gradio config (GET <space>.hf.space/config) carries the "Vanilla Gaia2 Leaderboard" table as the initial
// value of its dataframe component (headers Model, Provider, pass@1, Execution ... Noise, A2A, Submitter,
// Date). The score is pass@1, the board's headline. The same Space also shows a Gaia2-CLI board as HTML,
// a newer five-split task set without the noise and agent-to-agent splits; it is not this record.
// The Date column is the submission date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const SPACE = 'https://meta-agents-research-environments-leaderboard.hf.space';

interface Config {
  components: { id: number; type: string; props: { value?: { headers?: string[]; data?: unknown[][] } } }[];
}

const board: Leaderboard = {
  benchmark: 'meta-agents-research-environments-are-gaia2',
  url: 'https://huggingface.co/spaces/meta-agents-research-environments/leaderboard',
  feed: `${SPACE}/config (Vanilla Gaia2 Leaderboard dataframe, pass@1)`,
  terms: 'Public Hugging Face Space; its robots.txt allows every path and the Space states no terms of its own.',
  aliases: {
    'Claude-4-Sonnet Thinking': 'claude-sonnet-4',
    'Claude-4-Sonnet': 'claude-sonnet-4',
    'DeepSeek-v3.1 Terminus': 'deepseek-v3-1-terminus',
    // evaluated in September 2025, after the 0905 release
    'Kimi-K2': 'kimi-k2-sep-2025',
    'Qwen3-235B-thinking': 'qwen3-235b-a22b-thinking-jul-2025',
    'Qwen3-235B': 'qwen3-235b-a22b',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const cfg = await fetchJson<Config>(`${SPACE}/config`);
    const table = cfg.components
      .map((c) => c.props?.value)
      .find((v) => v?.headers?.includes('pass@1') && v.headers.includes('Noise'));
    if (!table?.headers || !table.data) throw new Error('Vanilla Gaia2 table not found in the Space config');
    const h = table.headers;
    const iModel = h.indexOf('Model');
    const iScore = h.indexOf('pass@1');
    const iDate = h.indexOf('Date');
    return table.data.map((r) => {
      const name = String(r[iModel] ?? '').trim();
      const effort = /\((high|low|medium|minimal)\)$/i.exec(name)?.[1]?.toLowerCase();
      const date = String(r[iDate] ?? '');
      return {
        model: effort ? name.replace(/\s*\([^)]*\)$/, '') : name,
        score: Number(r[iScore]),
        setting: effort ?? (/thinking/i.test(name) ? 'thinking' : undefined),
        date: /^\d{4}-\d\d-\d\d$/.test(date) ? date : undefined,
      };
    });
  },
};
export default board;
