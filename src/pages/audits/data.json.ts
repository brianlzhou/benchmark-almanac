// The whole data audit as JSON: every check's rule, the totals per check, and each benchmark's results as
// [check, status, what we found]. The same audit the benchmark pages and /audits/data/ show (src/lib/bench-audit.ts).
import { allAudits, CHECKS, GROUPS, STATUS_WORD, linksChecked, ALL_CHECKS } from '../../lib/bench-audit.ts';
import { AS_OF, benchById } from '../../lib/data.ts';

export function GET() {
  const { audits, totals } = allAudits();
  const body = {
    note: `The data audit of every benchmark: ${ALL_CHECKS ? 'what the record says, where its scores come from, how its leaderboard is read, whether its numbers agree, and whether its links work' : 'how well we verified its record, who has scored it and how recently, how fresh our read of its leaderboard is, and how far labs\' own numbers sit from independent runs'}. Each result is [check, status, detail]. A note (info) means the check does not apply or needs no fix.`,
    asOf: AS_OF,
    linksChecked: ALL_CHECKS ? (linksChecked() ?? null) : undefined,
    statuses: STATUS_WORD,
    groups: GROUPS.filter((g) => totals.some((t) => t.group === g.id)),
    checks: Object.entries(CHECKS)
      .filter(([key]) => totals.some((t) => t.key === key))
      .map(([key, c]) => ({ key, ...c })),
    totals: totals.map(({ key, pass, warn, fail, info }) => ({ key, pass, warn, fail, info })),
    benchmarks: audits.map((a) => ({
      id: a.id,
      name: benchById.get(a.id)?.name ?? a.id,
      summary: { pass: a.summary.pass, warn: a.summary.warn, fail: a.summary.fail, info: a.summary.info, text: a.summary.text },
      checks: a.checks.map((c) => [c.key, c.status, c.detail]),
    })),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}
