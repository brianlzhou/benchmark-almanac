// The key words of each benchmark's description, one string per row of /search.json, loaded after it.
// See src/lib/search-index.ts.
import { searchIndex, json } from '../lib/search-index.ts';

export function GET() {
  const { v, words } = searchIndex();
  return json({ v, words });
}
