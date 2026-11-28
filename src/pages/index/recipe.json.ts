// The recipe of the version in force on the data's date: its tests, weights and boards. On the 1st of a month the
// sync copies it into data/index/YY.MM.json (scripts/freeze-index.ts), which freezes that version.
import type { APIRoute } from 'astro';
import { currentRecipe } from '../../lib/almanac-index-data.ts';
import { recipeText } from '../../lib/almanac-index.ts';

export const GET: APIRoute = () => new Response(recipeText(currentRecipe()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
