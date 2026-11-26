// Sends the pages a production deploy changed to IndexNow, once the deploy is live. The build listed them in
// /indexnow/changed.txt (scripts/lib/indexnow.ts). .github/workflows/indexnow.yml runs this with no arguments when
// Vercel reports a finished deploy of main, and the script reads that GitHub status event.
//
//   node scripts/indexnow.ts --commit <sha> [--dry-run]
//
// By hand, --commit names the deploy that must be live, and --dry-run prints the list without sending it.
import { appendFileSync, readFileSync } from 'node:fs';
import { CHANGED_FILE, SITE, isProductionDeploy, parseChanged, sendToIndexNow } from './lib/indexnow.ts';

/** How long to wait for the deploy to show on the live site, after Vercel calls it finished. */
const WAIT = 5 * 60_000;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const summary = (s: string) => {
  console.log(s);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${s}\n`);
};

let commit = args.includes('--commit') ? args[args.indexOf('--commit') + 1] : undefined;
if (!commit) {
  if (!process.env.GITHUB_EVENT_PATH) throw new Error('Pass --commit <sha>, or run this from the IndexNow workflow');
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (!isProductionDeploy(event)) {
    const on = (event.branches ?? []).map((b: { name: string }) => b.name).join(', ') || 'no branch';
    console.log(`Not a finished deploy of main (${event.context} ${event.state} on ${on}), so there is nothing to send.`);
    process.exit(0);
  }
  commit = event.sha as string;
}

// the live list, once it is this commit's
type List = ReturnType<typeof parseChanged>;
let changed: List | undefined;
for (const until = Date.now() + (dryRun ? 0 : WAIT); ; ) {
  const res: Response = await fetch(`${SITE}/${CHANGED_FILE}?commit=${commit}`, { signal: AbortSignal.timeout(30_000) });
  const list: List | undefined = res.ok ? parseChanged(await res.text()) : undefined;
  if (list?.commit === commit) {
    changed = list;
    break;
  }
  if (Date.now() >= until) break;
  await new Promise((r) => setTimeout(r, 15_000));
}
if (!changed) {
  summary(`The live site doesn't show commit ${commit.slice(0, 8)}. A newer deploy may have replaced it, so nothing was sent.`);
  process.exit(0);
}
if (changed.base === 'unknown') {
  summary(`The build of ${commit.slice(0, 8)} couldn't read the live fingerprints, so it listed no pages and nothing was sent.`);
  process.exit(0);
}
const since = changed.base === 'none' ? 'the first fingerprinted deploy' : `commit ${changed.base?.slice(0, 8)}`;
if (!changed.paths.length) {
  summary(`No page changed since ${since}, so nothing was sent.`);
  process.exit(0);
}
const urls = changed.paths.map((p) => `${SITE}${p}`);
console.log(urls.slice(0, 20).join('\n') + (urls.length > 20 ? `\n...and ${urls.length - 20} more` : ''));
if (dryRun) {
  console.log(`Dry run: ${urls.length} pages changed since ${since}. Nothing was sent.`);
  process.exit(0);
}
await sendToIndexNow(urls);
summary(`Sent ${urls.length.toLocaleString('en-US')} new or changed pages to IndexNow (changes since ${since}).`);
