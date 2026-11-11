// Preserve the currently cataloged Open Track, including the organizer baseline.
import { carChallenge } from '../lib/boards/car-challenge.ts';
export default {...carChallenge(1),benchmark:'car-bench'};
