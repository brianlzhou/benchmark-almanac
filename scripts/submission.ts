// Benchmark submissions arrive as GitHub issues from the form in .github/ISSUE_TEMPLATE/benchmark.yml.
//
// usage:
//   node scripts/submission.ts --event <reply.md> <labels.txt>
//     In the submission workflow: reads the issue from $GITHUB_EVENT_PATH, checks it against the registry, and
//     writes the reply and the labels to add. It never runs or fetches anything from the issue text.
//   node scripts/submission.ts --list [--all]
//     On your computer, with the GitHub CLI signed in: prints the open submissions (or all, with --all) as
//     JSON lines, one parsed submission each, with the same check.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dataPath, readJson, key } from './lib/util.ts';
import { knownId } from './lib/discover/core.ts';

const REPO = 'brianlzhou/benchmark-almanac';
const SITE = (process.env.SITE_URL ?? '').replace(/\/$/, '');

// the form's labels, by field. Keep them in step with benchmark.yml
const FIELDS: Record<string, string> = {
  Name: 'name',
  Version: 'version',
  'What it tests': 'tests',
  Area: 'area',
  'Paper or report': 'paper',
  Code: 'code',
  Data: 'data',
  'Test set': 'access',
  License: 'license',
  Leaderboard: 'leaderboard',
  'Scores file': 'scores',
  Scoring: 'scoring',
  Released: 'released',
  'Made by': 'makers',
  'Which tests does it pass?': 'passes',
  Evidence: 'evidence',
  Replaces: 'replaces',
  'Your connection to it': 'role',
  'Anything else': 'more',
};
// worth asking for when empty: each one makes the review faster
const HELPFUL: [string, string][] = [
  ['code', 'a link to the code'],
  ['data', 'a link to the data'],
  ['license', 'the license'],
  ['leaderboard', 'a leaderboard'],
  ['scoring', 'the metric and its unit'],
  ['released', 'the release month'],
  ['makers', 'who made it'],
];

type Submission = Record<string, string | string[]> & { passes: string[] };

/** An issue form body is a run of "### Label" sections. Empty answers read "_No response_". */
export function parse(body: string): Submission {
  const out: Submission = { passes: [] };
  const parts = body.replace(/\r\n/g, '\n').split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const label = part.slice(0, nl).trim();
    const value = part.slice(nl + 1).trim();
    const field = FIELDS[label];
    if (!field || !value || value === '_No response_' || value === 'None') continue;
    if (field === 'passes') out.passes = [...value.matchAll(/^- \[[xX]\] (.+)$/gm)].map((m) => m[1].trim());
    else out[field] = value;
  }
  return out;
}

/** A link reduced to what identifies it: an arXiv id, a GitHub repository, a Hugging Face dataset, or host and path. */
function linkKey(url: string): string | undefined {
  const u = url.trim().toLowerCase();
  const arxiv = u.match(/arxiv\.org\/(?:abs|pdf|html)\/(\d{4}\.\d{4,5})/);
  if (arxiv) return `arxiv:${arxiv[1]}`;
  const gh = u.match(/github\.com\/([\w.-]+\/[\w.-]+)/);
  if (gh) return `gh:${gh[1].replace(/\.git$/, '')}`;
  const hf = u.match(/huggingface\.co\/(?:datasets\/|spaces\/)?([\w.-]+\/[\w.-]+)/);
  if (hf) return `hf:${hf[1]}`;
  try {
    const p = new URL(u);
    return `${p.hostname.replace(/^www\./, '')}${p.pathname.replace(/\/$/, '')}`;
  } catch {
    return undefined;
  }
}
const linksIn = (text: string) => (text.match(/https?:\/\/[^\s)>\]]+/g) ?? []).map(linkKey).filter((k): k is string => !!k);

const registry = readJson<{ id: string; name: string; links?: Record<string, string> }[]>(dataPath('benchmarks.json'));
const reviewed = readJson<{ rejected?: { name: string; url?: string; reason: string; date: string }[] }>(dataPath('reviewed.json'));
const byLink = new Map<string, string>();
for (const b of registry) for (const [kind, url] of Object.entries(b.links ?? {})) {
  // a site or leaderboard can host many benchmarks, so only papers, code and data identify one
  if (kind !== 'paper' && kind !== 'repo' && kind !== 'dataset') continue;
  const k = linkKey(url);
  if (k && !byLink.has(k)) byLink.set(k, b.id);
}
const rejectedByKey = new Map<string, { name: string; reason: string; date: string }>();
for (const r of reviewed.rejected ?? []) {
  rejectedByKey.set(`name:${key(r.name)}`, r);
  const k = r.url && linkKey(r.url);
  if (k) rejectedByKey.set(k, r);
}

export function check(s: Submission) {
  const name = String(s.name ?? '');
  const named = name ? knownId(s.version ? `${name} ${s.version}` : name) ?? knownId(name) : undefined;
  const links = [s.paper, s.code, s.data].filter(Boolean).flatMap((x) => linksIn(String(x)));
  const linked = links.map((k) => byLink.get(k)).find(Boolean);
  const id = named && !named.startsWith('left-out:') ? named : linked;
  const record = id ? registry.find((b) => b.id === id) : undefined;
  const rejected = !record ? (rejectedByKey.get(`name:${key(name)}`) ?? links.map((k) => rejectedByKey.get(k)).find(Boolean)) : undefined;
  const missing = HELPFUL.filter(([f]) => !s[f]).map(([, what]) => what);
  return { record, rejected, missing, status: record ? 'already-cataloged' : rejected ? 'left-out-before' : 'needs-review' };
}

function reply(s: Submission, c: ReturnType<typeof check>): string {
  const lines = ['Thanks for the submission. This reply comes from an automatic check. A person reviews every submission.', ''];
  if (c.record) {
    const where = SITE ? `[${c.record.name}](${SITE}/benchmarks/${c.record.id}/)` : `**${c.record.name}** (\`${c.record.id}\`)`;
    lines.push(`**Already here.** The almanac already has ${where}. If this is a new version, fill in *Replaces* with what changed in the tasks or the scoring. A new version gets its own record.`);
  } else if (c.rejected) {
    lines.push(`**Left out before.** A review on ${c.rejected.date} left out ${c.rejected.name}: “${c.rejected.reason}” If that has changed, edit this submission with the new evidence, and the check runs again.`);
  } else {
    lines.push('**New.** The almanac does not have this benchmark yet.');
  }
  lines.push('');
  if (!s.passes.length) lines.push('**Tests.** No test is ticked. The almanac adds a benchmark when it passes at least one of the four tests, so tick the ones it passes and link the evidence.', '');
  else lines.push(`**Tests.** The submission says it passes: ${s.passes.join(', ').toLowerCase()}.`, '');
  if (c.missing.length) lines.push('**Would help.** Edit the submission to add these, where they exist:', ...c.missing.map((m) => `- ${m}`));
  return lines.join('\n') + '\n';
}

const mode = process.argv[2];
if (mode === '--event') {
  const [replyPath, labelsPath] = process.argv.slice(3);
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8')) as { issue: { body: string | null } };
  const s = parse(event.issue.body ?? '');
  const c = check(s);
  writeFileSync(replyPath, reply(s, c));
  writeFileSync(labelsPath, c.status);
} else if (mode === '--list') {
  const state = process.argv.includes('--all') ? 'all' : 'open';
  const raw = execFileSync('gh', ['issue', 'list', '--repo', REPO, '--label', 'submission', '--state', state, '--limit', '500', '--json', 'number,title,url,createdAt,updatedAt,author,body,state'], { encoding: 'utf8' });
  for (const i of JSON.parse(raw) as { number: number; url: string; createdAt: string; updatedAt: string; state: string; author: { login: string }; body: string }[]) {
    const s = parse(i.body);
    const c = check(s);
    console.log(JSON.stringify({ issue: i.number, url: i.url, state: i.state, by: i.author.login, opened: i.createdAt.slice(0, 10), updated: i.updatedAt.slice(0, 10), status: c.status, existing: c.record?.id, ...s }));
  }
} else {
  console.error('usage: node scripts/submission.ts --event <reply.md> <labels.txt> | --list [--all]');
  process.exit(1);
}
