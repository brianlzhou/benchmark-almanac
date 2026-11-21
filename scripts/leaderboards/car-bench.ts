// The Open Track distinguishes pass@1 and pass@3 from pass^3.
// Preserve the currently cataloged Open Track, including the organizer baseline.
import { carChallenge } from '../lib/boards/car-challenge.ts';
export default {...carChallenge(1),benchmark:'car-bench'};
