import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/*
 * A Session row's leading cell, taken by a plugin.
 *
 * The stylesheet moves the host's own leading seat out of the line and starts
 * every title at the row inset, so the row's leading 16px belongs to whatever
 * a plugin paints there. `dsh-archive-manager` draws its favorite star as an
 * absolutely positioned `dsham_starSlot` over exactly that cell — it only
 * appears on hover or once a Session is favorited, but because it is out of
 * flow nothing pushes the title aside, and the star lands on the first glyph.
 *
 * The fix keeps the star where the plugin puts it and reserves its cell in the
 * title's start margin whenever the slot is a direct child of the row. The
 * offset is deliberately constant rather than hover-gated: the star is
 * `display: none` most of the time, and an indent that followed its visibility
 * would shift the whole list as the pointer moves from row to row.
 *
 * The class names below are the pinned build's; `aliasHostSelectors` rewrites
 * the `jJkEga_` prefix to whatever the app on screen ships.
 */

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

interface Rule {
  readonly selector: string;
  readonly body: string;
}

/** Flat `selector { body }` pairs; nested at-rule wrappers are skipped. */
function rules(sheet: string): Rule[] {
  const source = sheet.replace(/\/\*[\s\S]*?\*\//gu, '');
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/gu)].map(([, selector, body]) => ({
    selector: (selector ?? '').trim().replace(/\s+/gu, ' '),
    body: body ?? '',
  }));
}

const sidebar = rules(read('../src/client/features/sidebar/sidebar.css'));

/** The plugin's absolutely positioned favorite-control slot. */
const STAR_SLOT = '.dsham_starSlot';
const TITLE = '.jJkEga_title';

const reserving = sidebar.filter(
  rule => rule.selector.includes(STAR_SLOT) && rule.selector.includes(TITLE),
);

test('a plugin-drawn leading control keeps its cell before the title', () => {
  assert.equal(reserving.length, 1);
  const [rule] = reserving;
  const selector = rule?.selector ?? '';
  /* Gated like every other sidebar rule, and only on the Session row itself:
     the slot is a direct child, the title a direct child too. */
  assert.ok(selector.includes('[data-dsh-ccd-style="true"]'), selector);
  assert.ok(selector.includes('.jJkEga_sessionRow:has(> .dsham_starSlot)'), selector);
  assert.ok(selector.includes(`> ${TITLE}`), selector);
  /* The title's start margin is the star's 16px cell, following the row's own
     workspace indent so a nested list keeps the star and the title aligned. */
  assert.match(
    rule?.body ?? '',
    /margin-inline-start:\s*calc\(16px \+ var\(--dsh-workspace-indent, 0px\)\);/u,
    rule?.body ?? '',
  );
});
