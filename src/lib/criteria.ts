// What the almanac catalogs, in one place: the About page and the submission page both read it, and the
// submission form on GitHub (.github/ISSUE_TEMPLATE/benchmark.yml) asks for the evidence these tests need.

/** The four tests. A benchmark needs to pass one. */
export const CRITERIA = [
  { t: 'A major lab reports it', d: 'A lab that ships frontier or widely used models reports it in a launch post, model card, system card or technical report.' },
  { t: 'An independent leaderboard runs it', d: 'Its makers or a third party keep a leaderboard with scores for five or more current models.' },
  { t: 'An established evaluation group made it', d: 'For example Epoch AI, METR, Scale, Vals, ARC Prize, Apollo Research, UK AISI, US CAISI, SecureBio, Arena, HELM or Kaggle.' },
  { t: 'People use it', d: 'About 100 GitHub stars or 30 Hugging Face upvotes, coverage in a widely read newsletter, or other papers and model cards that run it.' },
];

export const STAYS_OUT =
  'test sets made only to evaluate one paper’s own method, training datasets, surveys, renamed copies of a test we already have, and narrow tasks outside general AI ability, such as crowd counting or defect detection. A new version that changes the tasks or the scoring gets its own record. One that only fixes broken tasks doesn’t.';

export const REPO = 'https://github.com/brianlzhou/benchmark-almanac';
/** The submission form: a GitHub issue form, so each submission arrives as structured, public, linkable text. */
export const SUBMIT_FORM = `${REPO}/issues/new?template=benchmark.yml`;
/** Submissions people have already sent, open and closed. */
export const SUBMISSIONS = `${REPO}/issues?q=label%3Asubmission`;
