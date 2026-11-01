// The home page search index: names, other spellings and details. See src/lib/search-index.ts.
import { searchIndex, json } from '../lib/search-index.ts';

export function GET() {
  const { v, rows } = searchIndex();
  return json({ v, rows });
}
