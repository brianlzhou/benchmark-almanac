## What this changes

<!-- One or two sentences. For a new benchmark, score or importer, name it. For a fix, link the issue. -->

## Sources

<!-- For data: a link for each new or changed value (the paper, the leaderboard, or the launch post or system
card that reports it). For an importer: the board's URL, the feed it reads, and the terms that allow it.
Delete this section for a code-only change. -->

## Checks

- [ ] `npm run check` passes (the data check and the type check)
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Hand-kept files only: no edits to `data/scores/`, `data/github.json`, `data/abstracts.json`, `data/discovered.json` or `public/meaning/`, which scripts write
- [ ] For a new importer: `node scripts/sync-leaderboards.ts --only <benchmark-id> --dry` reads the board, and its `terms` field names the license or terms
- [ ] For a page change: checked in light and dark, and at phone width
- [ ] New text uses American spelling, short sentences, and no semicolons or dashes as punctuation
