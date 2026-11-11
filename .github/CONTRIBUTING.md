# Contributing

## Open an issue

Most help arrives as an issue. Each form asks for what a reviewer needs:

| Form | Use it for |
| --- | --- |
| **Submit a benchmark** | A benchmark the almanac doesn't have yet. |
| **Add or fix a score** | A score a lab or leaderboard published that we lack or have wrong. |
| **Correct a record** | A wrong date, name or link. |
| **Log a known critique** | A published problem with a benchmark, such as a broken grader, leaked answers or contamination. |
| **I make or maintain a benchmark** | A results file or API we should read, or a fix to how your benchmark is described. |
| **Report a site bug** | Something on the site that looks broken. |
| **Suggest an idea** | A page, chart, filter or data source you'd like to see. |

A workflow checks each benchmark submission against the catalog and replies within a minute. A person then
reviews it. A benchmark joins the catalog when it passes at least one of four tests: a major lab reports it, an
independent leaderboard runs it, an established evaluation group made it, or people use it. The site's Submit
page explains each test.

## Pull requests

1. Edit the files in `data/` that people keep by hand: `labs.json`, `models.json`, `benchmarks.json`,
   `taxonomy.json`, `cards.json`, `system-cards.json`, `audits.json`, `sources.json`, `reviewed.json` and
   `resources.json`.
2. Leave the files that scripts write to the scripts: `data/scores/`, `data/github.json`,
   `data/abstracts.json`, `data/discovered.json` and `public/meaning/`.
3. Give a source for each new or changed value: the paper, the leaderboard or the model card that reports it.
4. Run `npm run check`, `npm test` and `npm run build`. All three must pass.

## Add a leaderboard importer

Each file in `scripts/leaderboards/` reads one benchmark's official leaderboard and is named after the
benchmark's id in `data/benchmarks.json`. Start from `scripts/leaderboards/aider-polyglot.ts`, point it at the
board's published data file, and test it with:

```sh
node scripts/sync-leaderboards.ts --only <benchmark-id> --dry
```

- Read only data that the board's terms and robots.txt allow, and state those terms in the `terms` field.
- Prefer a data file or API over the page's HTML. Never run JavaScript you downloaded. Read it as data.
- Keep the board's headline score in `score`. Sub-scores, splits and costs go in `metrics`, never in a row of
  their own, because the site keeps each model's best row.
- Put names that `scripts/lib/models.ts` can't place in the importer's `aliases` map.
- Shared readers for one site or one kind of source (a paper's HTML tables, a Next.js payload, a hashed chart
  transcription) live in `scripts/lib/boards/`. Reuse one before you write another.

`scripts/leaderboards/types.ts` documents every field.

## Style

Descriptions and notes in `data/benchmarks.json` use American spelling and short sentences, with no
semicolons and no dashes as punctuation. `node scripts/check-data.ts` fails on British spelling, semicolons
and dashes in those fields. Text quoted from a source, such as a paper title or a model card's own wording,
keeps its original spelling.

Benchmark notes hold caveats only: what a reader must know to read a score correctly. Page copy states findings
computed from the data rather than adjectives.

## Conduct

Everyone who takes part agrees to the [code of conduct](CODE_OF_CONDUCT.md).
