// Epoch AI's Benchmark Reviews, from data/epoch-reviews.json (scripts/sync-epoch-reviews.ts): Epoch audits a
// benchmark and gives it a verdict. Pages show the verdict, its date and Epoch's own summary, credited and linked.
import reviewsJson from '../../data/epoch-reviews.json';

export type EpochVerdict = 'verified' | 'flawed' | 'not-enough-info';
export interface EpochReview {
  epoch: string;
  verdict: EpochVerdict;
  url?: string;
  reviewed?: string;
  creator?: string;
  summary?: string;
}

const file = reviewsJson as { retrieved: string; reviews: Record<string, EpochReview> };

/** Epoch's search page for every reviewed benchmark, the link for a verdict with no review page. */
export const EPOCH_REVIEWS_URL = 'https://epoch.ai/benchmarks/search?reviewed=verified&reviewed=flawed&reviewed=not-enough-info';
export const EPOCH_REVIEWS_READ = file.retrieved;

/** How Epoch reviews benchmarks: the rubric and what each verdict means. */
export const EPOCH_REVIEWS_DOC = 'https://epoch.ai/data/benchmark-reviews-documentation';

/** Each verdict: its name as Epoch gives it, its tone for the status colors, and Epoch's definition, quoted. */
export const VERDICTS: Record<EpochVerdict, { name: string; tone: 'good' | 'bad' | 'neutral'; what: string }> = {
  verified: { name: 'Verified', tone: 'good', what: 'The benchmark can broadly be interpreted as described. Any errors that exist do not substantially affect the results.' },
  flawed: { name: 'Flawed', tone: 'bad', what: 'The benchmark has one or more substantive flaws that we believe users need to be aware of to accurately interpret results.' },
  'not-enough-info': { name: 'Not enough info', tone: 'neutral', what: 'There is not enough information for us to review the benchmark.' },
};

export const epochReviews = new Map(Object.entries(file.reviews));
export const epochReviewOf = (id: string): EpochReview | undefined => epochReviews.get(id);
