// The time machine's payload (src/lib/time-machine.ts): the page loads it to draw any day from 2023 to today.
import { timeMachinePayload } from '../lib/time-machine.ts';

export function GET() {
  return new Response(JSON.stringify(timeMachinePayload()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
