// Anthropic Red Team on HELM Safety (Stanford CRFM). The score is the "LM Evaluated Safety score" in
// anthropic_red_team.json, the judged safety of responses to 1,000 sampled red-team prompts, times 100. Read
// through helmRows in helm-capabilities.ts. The same table's "# output tokens" (mean output tokens per prompt)
// is read here as `tokens`: the file reads the table again and pairs its rows with helmRows' rows in order,
// only where the scores agree.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { HELM_ALIASES, HELM_BUCKET, HELM_TERMS, helmFeed, helmNewest, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'safety', group: 'anthropic_red_team', column: 'LM Evaluated Safety score', scale: 100 };

/** Score and mean output tokens of each scored row, in table order (helmRows keeps the same rows in that order). */
async function outputTokens(): Promise<{ score: number; tokens?: number }[]> {
  const newest = await helmNewest(TABLE.project, TABLE.kind);
  const [table] = await fetchJson<{ header: { value: string }[]; rows: { value?: unknown }[][] }[]>(`${HELM_BUCKET}/${newest}groups/${TABLE.group}.json`);
  const s = table.header.findIndex((h) => h.value === TABLE.column);
  const t = table.header.findIndex((h) => h.value === '# output tokens');
  if (s < 0 || t < 0) return [];
  return table.rows
    .filter((r) => typeof r[s]?.value === 'number' && Number.isFinite(r[s].value))
    .map((r) => ({ score: (r[s].value as number) * (TABLE.scale ?? 1), tokens: typeof r[t]?.value === 'number' && (r[t].value as number) > 0 ? (r[t].value as number) : undefined }));
}

const board: Leaderboard = {
  benchmark: 'anthropic-red-team',
  url: 'https://crfm.stanford.edu/helm/safety/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  async fetch() {
    const rows = await helmRows(TABLE);
    const extra = await outputTokens().catch(() => []);
    return rows.map((r, i): LeaderboardRow => (extra[i]?.tokens && extra[i].score === r.score ? { ...r, tokens: extra[i].tokens } : r));
  },
};
export default board;
