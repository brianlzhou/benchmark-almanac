// Refreshes data/github.json (stars, license, last push, archived) for every benchmark repo on GitHub.
// Needs GITHUB_TOKEN (or GH_TOKEN) for the 5,000 requests an hour the authenticated API allows.
//
// usage: node scripts/sync-github.ts
import { dataPath, readJson, writeJson, fetchJson, githubHeaders } from './lib/util.ts';

interface Repo {
  stars: number;
  license: string | null;
  pushed: string | null;
  archived: boolean;
}
const benchmarks = readJson<{ links?: { repo?: string } }[]>(dataPath('benchmarks.json'));
const current = readJson<Record<string, Repo>>(dataPath('github.json'));
const names = [
  ...new Set(
    benchmarks
      .map((b) => b.links?.repo?.match(/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?(?:[/#?]|$)/)?.[1])
      .filter((n): n is string => !!n),
  ),
].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

const out: Record<string, Repo> = {};
let failed = 0;
for (let i = 0; i < names.length; i += 8) {
  await Promise.all(
    names.slice(i, i + 8).map(async (n) => {
      try {
        const r = await fetchJson<{ full_name: string; stargazers_count: number; license: { spdx_id: string } | null; pushed_at: string; archived: boolean }>(
          `https://api.github.com/repos/${n}`,
          { headers: githubHeaders() },
        );
        out[n] = { stars: r.stargazers_count, license: r.license?.spdx_id ?? null, pushed: r.pushed_at?.slice(0, 10) ?? null, archived: r.archived };
      } catch {
        failed++;
        if (current[n]) out[n] = current[n];
      }
    }),
  );
}
writeJson(dataPath('github.json'), out);
console.log(`Checked ${names.length} repos. ${failed} could not be read and kept their last values.`);
