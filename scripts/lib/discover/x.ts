// X, read through Grok. X's terms forbid scraping, so this reader never fetches x.com. Grok Build, xAI's
// command-line agent, searches X with its own tools under the user's Grok sign-in, and this reader asks it for the
// benchmark launches of the scan window. Added 2026-11-06 at the user's request, after ShadowBench, DeepFinance and
// FrontierPhysics launched on X and the scan missed them.
//
// It runs only where Grok Build is installed and signed in (the user's Mac), not in GitHub Actions, and costs about
// $1.40 of Grok usage and 6 minutes a run. Grok answers in JSON against a schema. Every link it gives is fetched
// before it counts, so a link Grok guessed is dropped, and the finds go to the review queue like any other feed.
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { key } from '../util.ts';
import { FROM, TODAY, GENERAL, NICHE, arxivId, githubRepo, type Reader } from './core.ts';

const run = promisify(execFile);

export interface XLaunch {
  name: string;
  org?: string;
  post_url: string;
  links: string[];
  date: string;
  summary?: string;
  likes?: number;
}

const SCHEMA = {
  type: 'object',
  properties: {
    launches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          org: { type: 'string' },
          post_url: { type: 'string' },
          links: { type: 'array', items: { type: 'string' } },
          date: { type: 'string' },
          summary: { type: 'string' },
          likes: { type: 'integer' },
        },
        required: ['name', 'post_url', 'links', 'date'],
      },
    },
  },
  required: ['launches'],
};

export const xPrompt = (from: string, to: string) =>
  `Search X for posts from ${from} through ${to} that announce a NEW AI benchmark, eval, or leaderboard for language models or AI agents: a launch by its makers, not commentary on an existing benchmark, and not a model or product launch. Run several searches with different wording, for example "new benchmark", "introducing" with "benchmark", "eval", "leaderboard" and "we're releasing", and check posts with at least 50 likes. For each launch, give the benchmark name, the organization, the URL of the announcing post, every non-X link in the post or its thread (paper, site, GitHub, Hugging Face), the post date, a one-sentence summary, and the like count. Return only launches you saw in actual posts. Do not guess links.`;

/** The launches in Grok's JSON answer, without X links. */
export function xLaunches(stdout: string): XLaunch[] {
  const d = JSON.parse(stdout) as { structuredOutput?: { launches?: XLaunch[] }; text?: string };
  const out = d.structuredOutput ?? (d.text ? (JSON.parse(d.text) as { launches?: XLaunch[] }) : {});
  return (out.launches ?? [])
    .filter((l) => l.name && /^https:\/\/(?:x|twitter)\.com\/\w+\/status\/\d+/.test(l.post_url))
    .map((l) => ({ ...l, links: [...new Set((l.links ?? []).filter((u) => /^https?:\/\//.test(u) && !/^https?:\/\/(?:[\w-]+\.)?(?:x|twitter)\.com\b|t\.co\//.test(u)))] }));
}

export async function xGrok(r: Reader) {
  const bin = process.env.GROK_BIN ?? join(homedir(), '.grok', 'bin', 'grok');
  if (!existsSync(bin)) {
    r.note('Grok Build is not installed here, so X was not searched');
    return;
  }
  // an empty folder, so Grok has no project files or rules to read
  const dir = mkdtempSync(join(tmpdir(), 'grok-x-'));
  let stdout: string;
  try {
    ({ stdout } = await run(
      bin,
      [
        '-p',
        xPrompt(FROM, TODAY),
        // search only: no shell, no file tools, no subagents
        '--disallowed-tools',
        'run_terminal_cmd,write,search_replace,read_file,grep,list_dir,Agent',
        '--max-turns',
        '16',
        '--output-format',
        'json',
        '--json-schema',
        JSON.stringify(SCHEMA),
        '--no-auto-update',
        '--cwd',
        dir,
      ],
      { cwd: dir, signal: r.signal, timeout: 560_000, maxBuffer: 32 * 1024 * 1024 },
    ));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const launches = xLaunches(stdout);
  r.read(launches.length);
  for (const l of launches) {
    // the almanac never uses Artificial Analysis data, so its own benchmarks are not candidates
    if (/artificial\s*analysis|artificialanalysis\.ai/i.test(`${l.org ?? ''} ${l.links.join(' ')}`)) continue;
    // a link counts only when it answers, so a link Grok guessed never reaches the queue
    const live: string[] = [];
    for (const u of l.links.slice(0, 5)) {
      const ok = await r
        .text(u, { timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
      if (ok) live.push(u);
    }
    if (live.length < l.links.length) r.note(`${l.name}: dropped ${l.links.length - live.length} link(s) that did not answer`);
    const repo = live.map((u) => githubRepo(u)).find(Boolean);
    const site = live.find((u) => !arxivId(u) && !githubRepo(u));
    const text = `${l.name} ${l.summary ?? ''}`;
    r.add(
      {
        key: key(l.name),
        name: l.name,
        title: (l.summary ?? l.name).slice(0, 160),
        url: site ?? l.post_url,
        org: l.org,
        arxiv: live.map((u) => arxivId(u)).find(Boolean),
        repo,
        upvotes: l.likes,
        introduced: true,
        stageA: 5,
        general: GENERAL.test(text),
        niche: NICHE.test(text),
      },
      { feed: 'X (via Grok)' },
    );
  }
}
