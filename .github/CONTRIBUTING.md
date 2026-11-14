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

### After a maintainer accepts an issue

You don't need to write code. When a maintainer adds the **accepted** label, a bot
(`.github/workflows/accept.yml`, which runs `scripts/accept.ts`) turns the form into a pull request, runs the data
checks and links the pull request on your issue. A maintainer reviews it before it merges.

| Form | What the bot does |
| --- | --- |
| **Submit a benchmark** | Adds a record to `data/benchmarks.json` and lists it as added in `data/reviewed.json`. |
| **Log a known critique** | Adds an audit to `data/audits.json`, or a finding to an audit that has the same source link. |
| **I make or maintain a benchmark** | Applies the `field: value` lines in **Text changes** to the benchmark. A results feed waits for a maintainer to write its importer. |
| **Add or fix a score** | Adds or fixes a result on the launch post or system card whose link matches **Source**. |
| **Correct a record** | Drafts a pull request from the `field: value` lines in **What is wrong**. |
| **Report a site bug**, **Suggest an idea** | Replies on the issue. These don't change data. |

When the bot can't read a value safely, or the data checks fail, it opens no pull request and says why on the
issue. A maintainer then makes the change by hand.

## Pull requests

The JSON files in `data/` are the almanac's source of truth. A change merged there stays there: no other copy
rebuilds them.

1. Edit the files in `data/` that people keep by hand: `labs.json`, `models.json`, `benchmarks.json`,
   `taxonomy.json`, `cards.json`, `system-cards.json`, `audits.json`, `claim-notes.json`, `sources.json`,
   `reviewed.json` and `resources.json`. Keep each file's order and its two-space indent. `benchmarks.json` is
   sorted by name, and `reviewed.json` keeps `added` sorted by id and `rejected` sorted by name. Alphabetical
   order puts each pull request's new lines in a different place, so two pull requests rarely conflict.
2. Leave the files that scripts write to the scripts. The daily sync updates `data/scores/` from the leaderboards
   and Epoch AI on its own, and other scripts write `data/github.json`, `data/abstracts.json`,
   `data/discovered.json`, `data/discovered-models.json`, `data/discovered-audits.json` and `public/meaning/`.
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

A reviewer may restyle the text of a pull request or an accepted issue to these rules before it merges.

## For maintainers

The forms and the accept bot need these labels. GitHub applies only labels that exist:

```sh
for l in submission critique maintainer score correction bug idea accepted; do
  gh label create "$l" --repo brianlzhou/benchmark-almanac --force
done
```

The accept bot also needs the repository setting **Allow GitHub Actions to create and approve pull requests**
(Settings, Actions, General). To see what the bot would do with an issue, save it as JSON
(`gh issue view <n> --json number,title,body,labels > issue.json`) and run
`node scripts/accept.ts --dry issue.json`.

## Conduct

Everyone who takes part agrees to the [code of conduct](CODE_OF_CONDUCT.md).
