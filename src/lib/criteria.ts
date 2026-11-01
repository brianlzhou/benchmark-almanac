// What the almanac catalogues, in one place: the About page and the submission page both read it, and the
// submission form on GitHub (.github/ISSUE_TEMPLATE/benchmark.yml) asks for the evidence these tests need.

/** The four tests. A benchmark needs to pass one. */
export const CRITERIA = [
  { t: 'A major lab reports it', d: 'It appears in a launch post, model card, system card or technical report from a lab that ships frontier or widely used models.' },
  { t: 'An independent leaderboard runs it', d: 'A leaderboard the benchmark’s makers or a third party keep up has scored five or more current models on it.' },
  { t: 'An established evaluation group made it', d: 'For example Epoch AI, METR, Scale, Vals, ARC Prize, Apollo Research, UK AISI, US CAISI, SecureBio, Arena, HELM or Kaggle.' },
  { t: 'People use it', d: 'About 100 GitHub stars or 30 Hugging Face upvotes, coverage in a widely read newsletter, or other papers and model cards that run it.' },
];

export const STAYS_OUT =
  'a test set that exists only to evaluate one paper’s own method, training datasets, narrow tasks outside general AI ability (crowd counting, defect detection), surveys, and renamed copies of a test already here. A new version that changes the tasks or the scoring gets its own record. A release that only fixes broken tasks does not.';

export const REPO = 'https://github.com/brianlzhou/benchmark-almanac';
/** The submission form: a GitHub issue form, so each submission arrives as structured, public, linkable text. */
export const SUBMIT_FORM = `${REPO}/issues/new?template=benchmark.yml`;
/** Submissions people have already sent, open and closed. */
export const SUBMISSIONS = `${REPO}/issues?q=label%3Asubmission`;
