// Adds the rows a long table's HTML leaves out. The table names a file of row batches in data-more, and the rows
// arrive marked data-later, so they stay hidden until the filter script lays them out. A batch goes in at a time,
// with a pause between batches, so the page keeps answering clicks and keys while thousands of rows arrive.
export async function loadMoreRows(table: HTMLTableElement | null): Promise<void> {
  const url = table?.dataset.more;
  const body = table?.tBodies[0];
  if (!table || !url || !body) return;
  table.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const batches = (await res.json()) as string[];
    const t = document.createElement('template');
    for (const html of batches) {
      t.innerHTML = html;
      body.append(t.content);
      await new Promise((r) => setTimeout(r, 0));
    }
  } catch (e) {
    // the first rows still work, and the note under the table links to the full lists by area
    console.warn('Could not load the rest of the table', e);
  } finally {
    table.removeAttribute('aria-busy');
  }
}
