// LaTeXML sometimes renders a tabular as nested spans instead of native table elements.
// Convert only structural classes, then reuse the paper reader and its span expansion.
import { paperTables, grid } from './arxiv-span-tables.ts';
export function inlinePaperTables(html: string): string[][][] {
  const stack: string[] = [];
  const normalized = html.replace(/<\/?span\b[^>]*>/gi, tag => {
    if (tag.startsWith('</')) return `</${stack.pop() ?? 'span'}>`;
    const classes = tag.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
    const name = classes.includes('ltx_tabular') ? 'table' : classes.includes('ltx_tr') ? 'tr' : classes.includes('ltx_td') ? 'td' : 'span';
    stack.push(name);
    if (name === 'span') return tag;
    const col = classes.find(c => /^ltx_colspan_\d+$/.test(c))?.split('_').pop();
    const row = classes.find(c => /^ltx_rowspan_\d+$/.test(c))?.split('_').pop();
    return `<${name}${col ? ` colspan="${col}"` : ''}${row ? ` rowspan="${row}"` : ''}>`;
  });
  return paperTables(normalized).map(grid);
}
