// Sonetra reports exact recognition of synthetic SNOMED CT terms without a supplied term list in the specialist-language table.
import { htmlBoard } from './geomap-bench.ts';

export default htmlBoard({
  "benchmark": "norwegian-snomed-ct-term-recognition-sonetra",
  "url": "https://sonetra.no/evaluering",
  "feed": "https://sonetra.no/evaluering",
  "terms": "The evaluation page gives no score reuse terms. Use only the six rows for synthetic specialist terms without a supplied list. https://sonetra.no/evaluering The site publishes crawler-specific restrictions.",
  "model": "System",
  "score": "%",
  "minimum": 6,
  "parts": {}
});
