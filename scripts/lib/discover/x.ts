// X, read through Grok. X's terms forbid scraping, so this reader never fetches x.com. Grok Build, xAI's
// command-line agent, searches X with its own tools under the maintainer's Grok sign-in, and this reader asks it for
// the benchmark launches of the scan window. Added 2026-11-06, after ShadowBench, DeepFinance and FrontierPhysics
// launched on X and the scan missed them.
//
// It runs only where Grok Build is installed and signed in (a maintainer's computer), not in GitHub Actions. Since
// 2026-11-18 a scan is three short Grok runs in parallel, each stopped after 9 minutes. Grok
// answers in JSON against a schema. Every link it gives is fetched before it counts, so a link Grok guessed is
// dropped, and the finds go to the review queue like any other feed.
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

// The search widened on 2026-11-18, after FrontierEE Bench (a company page and one post saying "Today we're
// introducing FrontierEE Bench") launched on X and a scan that returned 3 launches missed it. Names often end in
// "Bench" with no space, and small labs' posts have few likes, so the floor is 20. A Grok turn takes about 45 s, and
// one run doing a dozen searches timed out, so three short runs share the work in parallel. A run that finishes
// keeps its launches when another times out. A test on 2026-11-18 read 4 launches and found 2 new ones.
const ASK = (from: string, to: string) =>
  `Search X for posts from ${from} through ${to} that announce a NEW AI benchmark, eval, or leaderboard for language models or AI agents: a launch by its makers, not commentary on an existing benchmark, and not a model or product launch.`;
const ANSWER =
  'Check every post with at least 20 likes, from labs, universities and startups alike. Return every launch you find, up to 30. For each launch, give the benchmark name, the organization, the URL of the announcing post, every non-X link in the post or its thread (paper, site, GitHub, Hugging Face), the post date, a one-sentence summary, and the like count. Return only launches you saw in actual posts. Do not guess links.';
export const X_SEARCHES = {
  launches: 'Run four searches: "new benchmark", "introducing" with "benchmark", "today we\'re introducing" with "bench", and "we\'re releasing" with "eval".',
  names: 'Run four searches: "leaderboard" with "models", "evals" with "frontier models", a new name ending in "Bench" (such as "FrontierEE Bench"), and "best model scored".',
  fields: 'Run two searches, each pairing "benchmark" with a group of fields: "engineering OR hardware OR robotics OR science", and "medicine OR law OR finance OR security".',
} as const;
export const xPrompt = (from: string, to: string, part: keyof typeof X_SEARCHES = 'launches') => `${ASK(from, to)} ${X_SEARCHES[part]} ${ANSWER}`;

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
  // one Grok run per third of the search, in parallel. A run's launches count when another fails.
  const ask = async (part: keyof typeof X_SEARCHES): Promise<XLaunch[]> => {
    // an empty folder, so Grok has no project files or rules to read
    const dir = mkdtempSync(join(tmpdir(), 'grok-x-'));
    try {
      const { stdout } = await run(
        bin,
        [
          '-p',
          xPrompt(FROM, TODAY, part),
          // search only: no shell, no file tools, no subagents
          '--disallowed-tools',
          'run_terminal_cmd,write,search_replace,read_file,grep,list_dir,Agent',
          '--max-turns',
          '10',
          '--output-format',
          'json',
          '--json-schema',
          JSON.stringify(SCHEMA),
          '--no-auto-update',
          '--cwd',
          dir,
        ],
        { cwd: dir, signal: r.signal, timeout: 540_000, maxBuffer: 32 * 1024 * 1024 },
      );
      return xLaunches(stdout);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const parts = Object.keys(X_SEARCHES) as (keyof typeof X_SEARCHES)[];
  const got = await Promise.allSettled(parts.map(ask));
  got.forEach((g, i) => g.status === 'rejected' && r.note(`the ${parts[i]} search failed: ${String((g.reason as Error)?.message ?? g.reason).slice(0, 120)}`));
  if (got.every((g) => g.status === 'rejected')) throw new Error('every X search failed');
  const seenNames = new Map<string, XLaunch>();
  for (const g of got)
    if (g.status === 'fulfilled')
      for (const l of g.value) {
        const had = seenNames.get(key(l.name));
        if (had) had.links = [...new Set([...had.links, ...l.links])];
        else seenNames.set(key(l.name), l);
      }
  const launches = [...seenNames.values()];
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
